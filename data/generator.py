"""
Faultline Synthetic Error Dataset Generator
Generates ~600 realistic errors from 8 KNOWN root causes with extensive variants:
- frame order permutations
- extra / missing frames
- multiple browser engines and OS platforms
- reworded messages and dynamic values
- variable line numbers and paths
Includes 2 tricky cases:
1. Two different bugs with almost identical wording (RC-1 vs RC-7)
2. One bug manifesting across 4 completely different stack traces (RC-8)
"""

import json
import os
import random
from datetime import datetime, timedelta, timezone

ROOT_CAUSES = {
    "RC-1": {
        "id": "RC-1",
        "name": "NULL_USER_ON_LOGIN",
        "title": "Null user object during login authentication callback",
        "description": "User credential verification returns null profile under edge-case auth flows, crashing session init.",
        "exception_type": "TypeError",
        "is_tricky": True,
        "tricky_note": "Tricky Case 1A: Almost identical wording to RC-7 ('reading avatar_url' or 'reading id'), but distinct root cause (Auth vs Org Settings).",
        "message_templates": [
            "Cannot read properties of null (reading 'id')",
            "TypeError: Cannot read properties of null (reading 'email')",
            "Cannot read properties of undefined (reading 'avatar_url')",
            "TypeError: user is null, unable to resolve credentials for session {uid}",
            "Cannot destructure property 'token' of undefined or null at login callback",
        ],
        "base_frames": [
            ("at validateSessionCredentials", "src/auth/sessionManager.ts"),
            ("at handleAuthCallback", "src/controllers/authController.ts"),
            ("at dispatchLoginAction", "src/redux/slices/authSlice.ts"),
            ("at HTMLButtonElement.handleLoginClick", "src/components/LoginModal.tsx"),
        ],
        "extra_frames": [
            ("at withAuthTelemetry", "src/telemetry/authLogger.ts"),
            ("at rateLimitCheck", "src/middleware/rateLimiter.ts"),
            ("at next", "node_modules/express/lib/router/route.js"),
        ],
    },
    "RC-2": {
        "id": "RC-2",
        "name": "PAYMENT_GATEWAY_TIMEOUT",
        "title": "Upstream payment gateway timeout during checkout charge confirmation",
        "description": "Third-party payment gateway fails to respond within 15s deadline during card authorization.",
        "exception_type": "PaymentGatewayTimeoutError",
        "is_tricky": False,
        "message_templates": [
            "PaymentGatewayTimeoutError: Gateway timed out waiting for charge confirmation after {sec}s",
            "Upstream payment gateway response timed out after {ms}ms on intent {intent}",
            "TimeoutError: Request to payment capture endpoint timed out",
            "Payment provider gateway timeout during card authorization for order {order_id}",
            "E_GATEWAY_TIMEOUT: Stripe charge confirmation exceeded 15000ms deadline",
        ],
        "base_frames": [
            ("at StripeClient.confirmPaymentIntent", "src/billing/stripeClient.ts"),
            ("at PaymentService.chargeCustomerCard", "src/services/paymentService.ts"),
            ("at CheckoutController.processOrderPayment", "src/controllers/checkoutController.ts"),
            ("at handleCheckoutSubmit", "src/views/CheckoutView.tsx"),
        ],
        "extra_frames": [
            ("at auditLogPaymentAttempt", "src/audit/paymentAudit.ts"),
            ("at retryWithBackoff", "src/utils/httpRetry.ts"),
            ("at axiosInterceptor", "node_modules/axios/lib/adapters/http.js"),
        ],
    },
    "RC-3": {
        "id": "RC-3",
        "name": "DASHBOARD_MISSING_FIELD",
        "title": "Missing required metrics field in dashboard analytics payload",
        "description": "Backend analytics API omitted expected 'monthly_revenue' or 'active_sessions' keys in payload.",
        "exception_type": "KeyError",
        "is_tricky": False,
        "message_templates": [
            "KeyError: 'active_sessions' not found in dashboard metrics payload",
            "TypeError: Cannot read properties of undefined (reading 'monthly_revenue')",
            "Missing required field 'total_views' on dashboard metric widget {widget_id}",
            "Undefined metric property 'retention_rate' in summary card component",
            "Cannot read properties of undefined (reading 'sparkline_data')",
        ],
        "base_frames": [
            ("at calculateMetricDelta", "src/utils/metricsCalculator.ts"),
            ("at MetricsCard.renderStats", "src/components/Dashboard/MetricsCard.tsx"),
            ("at DashboardGrid.renderWidgets", "src/components/Dashboard/DashboardGrid.tsx"),
            ("at DashboardPage", "src/pages/DashboardPage.tsx"),
        ],
        "extra_frames": [
            ("at useAnalyticsQuery", "src/hooks/useAnalytics.ts"),
            ("at formatCurrency", "src/utils/formatter.ts"),
            ("at ErrorBoundary.componentDidCatch", "src/components/ErrorBoundary.tsx"),
        ],
    },
    "RC-4": {
        "id": "RC-4",
        "name": "DB_POOL_EXHAUSTED",
        "title": "PostgreSQL connection pool exhaustion under concurrent workload",
        "description": "Connection pool maximum capacity (20) reached; lease acquisition timed out after 5000ms.",
        "exception_type": "PoolTimeoutError",
        "is_tricky": False,
        "message_templates": [
            "PoolTimeoutError: Timeout waiting for free connection in pool (max 20 connections)",
            "Database connection pool exhausted: all 20 connections in use",
            "Could not acquire database client connection within 5000ms timeout",
            "KnexTimeoutError: Acquiring a connection from the pool timed out after 5000ms",
            "ConnectionAcquisitionTimeout: Pool exhausted, connection request timed out",
        ],
        "base_frames": [
            ("at Pool.acquireConnection", "src/db/connectionPool.ts"),
            ("at BaseRepository.executeQuery", "src/repositories/baseRepository.ts"),
            ("at OrganizationRepository.getMembers", "src/repositories/orgRepository.ts"),
            ("at getOrgMembersHandler", "src/api/routes/organization.ts"),
        ],
        "extra_frames": [
            ("at withTransaction", "src/db/transactionManager.ts"),
            ("at dbHealthMonitor", "src/monitoring/dbTelemetry.ts"),
            ("at Promise.then", "node_modules/pg-pool/index.js"),
        ],
    },
    "RC-5": {
        "id": "RC-5",
        "name": "INVALID_OR_EXPIRED_JWT",
        "title": "JWT bearer token signature expired or malformed",
        "description": "Authentication gateway rejects incoming request due to token expiration or key mismatch.",
        "exception_type": "TokenExpiredError",
        "is_tricky": False,
        "message_templates": [
            "TokenExpiredError: jwt expired at {timestamp}",
            "JsonWebTokenError: invalid signature on bearer authorization token",
            "JWT expired: signature validation failed against active keyset",
            "JsonWebTokenError: jwt malformed in authorization header",
            "Authentication failed: token expired or signature mismatch for token {tok}",
        ],
        "base_frames": [
            ("at JWTVerifier.verifyToken", "src/security/jwtVerifier.ts"),
            ("at AuthMiddleware.authenticateRequest", "src/middleware/authMiddleware.ts"),
            ("at Layer.handle_request", "node_modules/express/lib/router/layer.js"),
            ("at Route.dispatch", "node_modules/express/lib/router/route.js"),
        ],
        "extra_frames": [
            ("at extractBearerToken", "src/security/tokenExtractor.ts"),
            ("at JWKSRetriever.getSigningKey", "src/security/jwksClient.ts"),
            ("at auditAuthFailure", "src/audit/securityLogger.ts"),
        ],
    },
    "RC-6": {
        "id": "RC-6",
        "name": "PAYLOAD_TOO_LARGE_UPLOAD",
        "title": "HTTP multipart file upload exceeds maximum size ceiling",
        "description": "Incoming media/attachment upload exceeds the configured 15MB multipart limit.",
        "exception_type": "PayloadTooLargeError",
        "is_tricky": False,
        "message_templates": [
            "PayloadTooLargeError: file upload exceeds max limit of 15MB",
            "Request Entity Too Large (413): multipart upload exceeds 15728640 bytes",
            "PayloadTooLargeError: media attachment is {size_mb}MB, maximum allowed is 15MB",
            "Upload size limit exceeded: file '{filename}' rejected by multipart parser",
            "MaxBodyLengthExceeded: request entity exceeds 15MB ceiling on upload route",
        ],
        "base_frames": [
            ("at MulterStreamValidator.onFileStream", "src/upload/multipartValidator.ts"),
            ("at AttachmentUploadService.processFile", "src/services/uploadService.ts"),
            ("at FileUploadController.uploadAttachment", "src/controllers/uploadController.ts"),
            ("at DropzoneUpload.onDrop", "src/components/UploadModal.tsx"),
        ],
        "extra_frames": [
            ("at checkS3Quota", "src/storage/quotaEnforcer.ts"),
            ("at inspectMimeType", "src/utils/fileTypeDetector.ts"),
            ("at Busboy.emit", "node_modules/busboy/lib/main.js"),
        ],
    },
    "RC-7": {
        "id": "RC-7",
        "name": "ORG_SETTINGS_NULL_AVATAR",
        "title": "Workspace organization branding crash on undefined avatar object",
        "description": "Organization settings profile fails rendering when workspace branding logo has no avatar_url.",
        "exception_type": "TypeError",
        "is_tricky": True,
        "tricky_note": "Tricky Case 1B: Identical wording to RC-1 ('Cannot read properties of undefined (reading avatar_url)'), but in Organization settings, NOT user login.",
        "message_templates": [
            "Cannot read properties of undefined (reading 'avatar_url')",
            "TypeError: Cannot read properties of undefined (reading 'avatar_url')",
            "Cannot read properties of null (reading 'id')",
            "TypeError: workspace logo is null, unable to render branding for org {org_id}",
            "Cannot destructure property 'avatar_url' of undefined at org branding card",
        ],
        "base_frames": [
            ("at renderWorkspaceLogo", "src/settings/organizationBranding.tsx"),
            ("at OrganizationSettingsView.renderProfile", "src/views/settings/OrganizationSettingsView.tsx"),
            ("at SettingsLayout.renderContent", "src/layouts/SettingsLayout.tsx"),
            ("at OrgRouter.renderRoute", "src/routes/OrgRouter.tsx"),
        ],
        "extra_frames": [
            ("at useWorkspaceTheme", "src/hooks/useWorkspaceTheme.ts"),
            ("at validateBrandingAssets", "src/utils/brandingValidator.ts"),
            ("at ThemeProvider.render", "src/theme/ThemeProvider.tsx"),
        ],
    },
    "RC-8": {
        "id": "RC-8",
        "name": "REDIS_CACHE_PARTITION_DESYNC",
        "title": "Distributed Redis session store network partition / cluster desync",
        "description": "Shared Redis session node is unreachable or partitioned, causing cascading session lookup failures across completely different application layers.",
        "exception_type": "RedisConnectionError",
        "is_tricky": True,
        "tricky_note": "Tricky Case 2: One single underlying root cause (Redis partition) manifesting as 4 totally different stack traces (WebSocket, HTTP Auth, Celery Worker, GraphQL Directive).",
        "message_templates": [
            "RedisConnectionError: Connection lost to session redis cluster at redis-cluster-node-02:6379",
            "CommandTimedOut: Redis GET session:{session_id} timed out after 3000ms",
            "ClusterConnectionError: Failed to refresh cluster slots for Redis session tier",
            "RedisSessionStore: Socket closed abruptly while waiting for session cache",
            "ClusterDownError: CLUSTERDOWN The cluster is down (partition detected)",
        ],
        # 4 totally distinct stack pathways representing the 4 subsystems hit by the same Redis failure
        "stack_pathways": [
            # Pathway A: Frontend WebSocket reconnection
            [
                ("at SocketManager.onClose", "src/realtime/socketManager.ts"),
                ("at SocketManager.handleHeartbeatTimeout", "src/realtime/heartbeat.ts"),
                ("at WebSocketClient.dispatch", "src/client/wsClient.ts"),
                ("at HTMLDocument.onVisibilityChange", "src/listeners/visibility.ts"),
            ],
            # Pathway B: REST API user permission gate
            [
                ("at RedisSessionStore.getSession", "src/session/redisStore.ts"),
                ("at PermissionGuard.validateRole", "src/guards/permissionGuard.ts"),
                ("at ExpressApp.handleRequest", "src/server/app.ts"),
                ("at Server.emit", "node_modules/http/server.js"),
            ],
            # Pathway C: Background Celery / Queue worker job
            [
                ("at SessionCacheLookup.fetchUserSession", "src/workers/tasks/sessionCache.ts"),
                ("at SyncUserProfileTask.execute", "src/workers/jobs/syncProfile.ts"),
                ("at WorkerQueue.processNextJob", "src/queue/workerRunner.ts"),
                ("at main", "src/workers/bootstrap.ts"),
            ],
            # Pathway D: GraphQL resolver directive
            [
                ("at RequireAuthDirective.resolveSession", "src/graphql/directives/requireAuth.ts"),
                ("at executeFieldResolvers", "src/graphql/execution/fieldResolver.ts"),
                ("at ApolloServer.executeOperation", "src/graphql/server.ts"),
                ("at handleGraphQLRequest", "src/api/graphqlHandler.ts"),
            ],
        ],
    },
}

BROWSERS = [
    ("Chrome", "Chrome 122.0.6261.94"),
    ("Chrome", "Chrome 123.0.6312.86"),
    ("Chrome", "Chrome 124.0.6367.60"),
    ("Firefox", "Firefox 124.0.1"),
    ("Firefox", "Firefox 125.0"),
    ("Safari", "Safari 17.3.1 (WebKit)"),
    ("Safari", "Safari 17.4 (WebKit)"),
    ("Edge", "Edge 123.0.2420.65"),
]

OPERATING_SYSTEMS = [
    "macOS 14.3.1 (Sonoma)",
    "macOS 14.4",
    "Windows 11 (23H2)",
    "Windows 10 (22H2)",
    "Ubuntu 22.04 LTS",
    "iOS 17.4",
    "Android 14 (Pixel 8)",
]

RELEASES = ["v1.4.0", "v1.4.1", "v1.4.2", "v2.0.0-rc1", "v2.0.0"]

URL_ROUTES = {
    "RC-1": ["/login", "/auth/callback", "/signin/sso", "/auth/verify"],
    "RC-2": ["/checkout/payment", "/billing/upgrade", "/cart/confirm", "/order/pay"],
    "RC-3": ["/dashboard/overview", "/analytics/performance", "/dashboard/metrics", "/reports/live"],
    "RC-4": ["/api/v1/organizations", "/settings/team", "/workspace/members", "/admin/users"],
    "RC-5": ["/api/v2/protected", "/api/v1/user/profile", "/export/data", "/graphql"],
    "RC-6": ["/settings/avatar", "/projects/import", "/documents/upload", "/media/gallery"],
    "RC-7": ["/settings/organization", "/settings/branding", "/workspace/logo", "/settings/theme"],
    "RC-8": ["/realtime/feed", "/api/v1/session", "/graphql", "/workers/heartbeat"],
}


def build_stack_trace(frames: list, browser_type: str) -> str:
    """Format frame tuples into realistic browser or Node stack traces."""
    lines = []
    for fn, path in frames:
        lineno = random.randint(12, 480)
        colno = random.randint(4, 88)
        if browser_type == "Firefox":
            lines.append(f"{fn.replace('at ', '')}@{path}:{lineno}:{colno}")
        elif browser_type == "Safari":
            lines.append(f"{fn.replace('at ', '')}@https://app.faultline.io/{path}:{lineno}:{colno}")
        else:
            # Chrome / Edge / Node
            lines.append(f"    {fn} (https://app.faultline.io/{path}:{lineno}:{colno})")
    return "\n".join(lines)


def generate_single_error(rc_id: str, index: int) -> dict:
    rc_data = ROOT_CAUSES[rc_id]

    # Generate message with interpolated variables
    tmpl = random.choice(rc_data["message_templates"])
    msg = tmpl.format(
        uid=f"usr_{random.randint(1000, 9999)}",
        sec=random.choice([15, 30]),
        ms=random.choice([15000, 30000]),
        intent=f"pi_3N{random.randint(100000, 999999)}",
        order_id=f"ord_{random.randint(4000, 8999)}",
        widget_id=f"wgt_{random.choice(['rev', 'views', 'ret', 'churn'])}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        tok=f"eyJhb...{random.randint(100, 999)}",
        size_mb=round(random.uniform(16.5, 38.0), 1),
        filename=random.choice(["customer_export.csv", "profile_video.mp4", "dataset_large.tar.gz"]),
        org_id=f"org_{random.randint(200, 899)}",
        session_id=f"sess_{random.randint(10000, 99999)}",
    )

    browser_family, browser_name = random.choice(BROWSERS)
    os_name = random.choice(OPERATING_SYSTEMS)
    release = random.choice(RELEASES)
    route = random.choice(URL_ROUTES[rc_id])

    # Assemble stack frames
    if rc_id == "RC-8":
        # Tricky Case 2: Pick one of 4 completely distinct pathways
        pathway = random.choice(rc_data["stack_pathways"])
        frames = list(pathway)
        # Maybe inject a logger or jitter frame
        if random.random() < 0.4:
            frames.insert(1, ("at logExceptionContext", "src/monitoring/logger.ts"))
    else:
        frames = list(rc_data["base_frames"])
        # Frame order variation / missing / extra frames
        if random.random() < 0.35 and len(frames) > 2:
            # Swap or invert async dispatch order
            frames[0], frames[1] = frames[1], frames[0]

        # Extra frames injection
        if "extra_frames" in rc_data and random.random() < 0.5:
            extra = random.choice(rc_data["extra_frames"])
            frames.insert(random.randint(1, len(frames)), extra)

        # Missing frame (e.g. minified or pruned)
        if random.random() < 0.2 and len(frames) > 2:
            frames.pop()

    stack_trace = build_stack_trace(frames, browser_family)

    # Spread timestamps over past 5 days
    days_ago = random.uniform(0.05, 5.0)
    error_time = datetime.now(timezone.utc) - timedelta(days=days_ago)

    return {
        "index": index,
        "root_cause_id": rc_id,
        "root_cause_name": rc_data["name"],
        "root_cause_title": rc_data["title"],
        "is_tricky": rc_data.get("is_tricky", False),
        "tricky_note": rc_data.get("tricky_note"),
        "payload": {
            "message": msg,
            "stack_trace": stack_trace,
            "exception_type": rc_data["exception_type"],
            "browser": browser_name,
            "os": os_name,
            "url": f"https://app.faultline.io{route}",
            "user_id": f"usr_{random.randint(1001, 2500)}",
            "release": release,
            "timestamp": error_time.isoformat(),
        },
    }


def generate_dataset(errors_per_cause: int = 75) -> dict:
    all_errors = []
    idx = 0
    # Deterministic seed for reproducible testing
    random.seed(42)

    for rc_id in sorted(ROOT_CAUSES.keys()):
        for _ in range(errors_per_cause):
            err = generate_single_error(rc_id, idx)
            all_errors.append(err)
            idx += 1

    # Shuffle dataset so requests don't arrive strictly in batch blocks
    random.shuffle(all_errors)
    # Re-index
    for i, err in enumerate(all_errors):
        err["index"] = i

    dataset = {
        "metadata": {
            "total_errors": len(all_errors),
            "root_causes_count": len(ROOT_CAUSES),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "tricky_cases_explained": [
                "Tricky Case 1: RC-1 (NULL_USER_ON_LOGIN) vs RC-7 (ORG_SETTINGS_NULL_AVATAR) share identical messages ('reading avatar_url') across completely different application modules.",
                "Tricky Case 2: RC-8 (REDIS_CACHE_PARTITION_DESYNC) manifests in 4 totally disjoint stack traces (WebSocket, HTTP Auth, Celery Worker, GraphQL Directive).",
            ],
        },
        "root_causes": ROOT_CAUSES,
        "errors": all_errors,
    }
    return dataset


def save_ground_truth(file_path: str = "data/ground_truth.json") -> dict:
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    dataset = generate_dataset(errors_per_cause=75)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"[Dataset Generator] Successfully generated {len(dataset['errors'])} errors across 8 root causes.")
    print(f"[Dataset Generator] Saved to {file_path}")
    return dataset


if __name__ == "__main__":
    save_ground_truth()
