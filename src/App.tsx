import { useBootSequence } from "./hooks/useBootSequence";
import { BootScreen } from "./components/BootScreen";
import { CrashReport } from "./components/CrashReport";

export default function App() {
  const { lines, state, skip } = useBootSequence();

  return state === "booting" ? (
    <BootScreen lines={lines} onSkip={skip} />
  ) : (
    <CrashReport />
  );
}
