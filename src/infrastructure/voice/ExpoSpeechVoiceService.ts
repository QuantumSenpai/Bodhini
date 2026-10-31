import * as Speech from "expo-speech";
import type { AppLanguage } from "../../domain/document/document.types";
import type { VoiceService } from "../../domain/document/document.ports";

const LOCALE: Record<AppLanguage, string> = { en: "en-IN", bn: "bn-IN", hi: "hi-IN" };
export class ExpoSpeechVoiceService implements VoiceService {
  speak(text: string, language: AppLanguage): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Speech.stop();
        Speech.speak(text, {
          language: LOCALE[language],
          rate: 0.9,
          onDone: resolve,
          onStopped: resolve,
          onError: reject,
        });
      } catch (error) {
        reject(error);
      }
    });
  }


  stop(): void {
    Speech.stop();
  }
}
