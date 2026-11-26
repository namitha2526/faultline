import React, { createContext, useContext, useState, ReactNode } from "react";
import { Faultline } from "../faultline";
import { ALL_BUGS } from "../bugs";
import { triggerCardPaymentTimeout } from "../bugs/bug2PaymentTimeout";

interface SimulationState {
  isBursting: boolean;
  burstProgress: number;
  burstTotal: number;
  isBadDeployActive: boolean;
  badDeployCountdown: number;
}

interface ControlPanelContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  activeRelease: string;
  setActiveRelease: (release: string) => void;
  simulatedDevice: string;
  setSimulatedDevice: (device: string) => void;
  simulationState: SimulationState;
  triggerRandomBug: () => void;
  startBurst: () => Promise<void>;
  startBadDeployment: () => Promise<void>;
  stopSimulations: () => void;
}

const ControlPanelContext = createContext<ControlPanelContextType | undefined>(undefined);

export const ControlPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRelease, setActiveReleaseState] = useState<string>("1.4.1");
  const [simulatedDevice, setSimulatedDeviceState] = useState<string>("Auto (Real Browser)");
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isBursting: false,
    burstProgress: 0,
    burstTotal: 50,
    isBadDeployActive: false,
    badDeployCountdown: 0,
  });

  const [activeInterval, setActiveInterval] = useState<number | null>(null);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const setActiveRelease = (release: string) => {
    setActiveReleaseState(release);
    Faultline.setRelease(release);
  };

  const setSimulatedDevice = (device: string) => {
    setSimulatedDeviceState(device);
    if (device === "Chrome (Windows)") {
      Faultline.setBrowserOverride({ browser: "Chrome 122", os: "Windows 11" });
    } else if (device === "Safari (iOS / iPhone)") {
      Faultline.setBrowserOverride({ browser: "Mobile Safari 17.4", os: "iOS 17" });
    } else if (device === "Firefox (Ubuntu Linux)") {
      Faultline.setBrowserOverride({ browser: "Firefox 123", os: "Linux x86_64" });
    } else if (device === "Edge (Windows)") {
      Faultline.setBrowserOverride({ browser: "Microsoft Edge 122", os: "Windows 11" });
    } else {
      Faultline.setBrowserOverride(null);
    }
  };

  const triggerRandomBug = () => {
    const randomBug = ALL_BUGS[Math.floor(Math.random() * ALL_BUGS.length)];
    const randomPath = randomBug.paths[Math.floor(Math.random() * randomBug.paths.length)];
    try {
      randomPath.trigger();
    } catch {
      // Caught and logged by SDK
    }
  };

  const stopSimulations = () => {
    if (activeInterval) {
      clearInterval(activeInterval);
      setActiveInterval(null);
    }
    setSimulationState({
      isBursting: false,
      burstProgress: 0,
      burstTotal: 50,
      isBadDeployActive: false,
      badDeployCountdown: 0,
    });
  };

  // Burst: 50 errors over 10 seconds (1 error every 200ms)
  const startBurst = async () => {
    stopSimulations();
    setSimulationState((prev) => ({
      ...prev,
      isBursting: true,
      burstProgress: 0,
      burstTotal: 50,
    }));

    let count = 0;
    const interval = window.setInterval(() => {
      count++;
      triggerRandomBug();
      if (count % 3 === 0) {
        Faultline.flush().catch(() => {});
      }
      setSimulationState((prev) => ({
        ...prev,
        burstProgress: count,
      }));

      if (count >= 50) {
        clearInterval(interval);
        setActiveInterval(null);
        Faultline.flush().catch(() => {});
        setSimulationState((prev) => ({
          ...prev,
          isBursting: false,
        }));
      }
    }, 200);

    setActiveInterval(interval);
  };

  // Bad deployment: release changes to 1.4.3 and one chosen bug (e.g. Payment Timeout)
  // fires repeatedly (~20 errors in 15 seconds)
  const startBadDeployment = async () => {
    stopSimulations();
    setActiveRelease("1.4.3");

    let count = 0;
    const maxErrors = 20;
    setSimulationState((prev) => ({
      ...prev,
      isBadDeployActive: true,
      badDeployCountdown: 15,
    }));

    const interval = window.setInterval(() => {
      count++;
      try {
        triggerCardPaymentTimeout();
      } catch {
        // Handled
      }
      Faultline.flush().catch(() => {});

      setSimulationState((prev) => ({
        ...prev,
        badDeployCountdown: Math.max(0, 15 - Math.round((count / maxErrors) * 15)),
      }));

      if (count >= maxErrors) {
        clearInterval(interval);
        setActiveInterval(null);
        Faultline.flush().catch(() => {});
        setSimulationState((prev) => ({
          ...prev,
          isBadDeployActive: false,
          badDeployCountdown: 0,
        }));
      }
    }, 750); // 20 errors in 15 seconds

    setActiveInterval(interval);
  };

  return (
    <ControlPanelContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        activeRelease,
        setActiveRelease,
        simulatedDevice,
        setSimulatedDevice,
        simulationState,
        triggerRandomBug,
        startBurst,
        startBadDeployment,
        stopSimulations,
      }}
    >
      {children}
    </ControlPanelContext.Provider>
  );
};

export const useControlPanel = (): ControlPanelContextType => {
  const context = useContext(ControlPanelContext);
  if (!context) {
    throw new Error("useControlPanel must be used within a ControlPanelProvider");
  }
  return context;
};

