import type { LogTypeRegistry } from "./types";
import { SymptomForm, symptomLogAdapter } from "./SymptomForm";
import { MoodForm, moodLogAdapter } from "./MoodForm";
import { MedicationForm, medicationLogAdapter } from "./MedicationForm";
import { HabitForm, habitLogAdapter } from "./HabitForm";

export const logTypeRegistry: LogTypeRegistry = {
  symptom: { label: "Symptom", Form: SymptomForm, adapter: symptomLogAdapter },
  mood: { label: "Mood", Form: MoodForm, adapter: moodLogAdapter },
  medication: { label: "Medication", Form: MedicationForm, adapter: medicationLogAdapter },
  habit: { label: "Habit", Form: HabitForm, adapter: habitLogAdapter },
};
