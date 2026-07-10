import { LoginGate } from "@/components/AuthGate";
import { QuizGame } from "@/components/QuizGame";

export default function GamificationPage() {
  return (
    <LoginGate>
      <QuizGame />
    </LoginGate>
  );
}
