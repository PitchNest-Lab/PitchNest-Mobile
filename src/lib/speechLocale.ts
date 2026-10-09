/**
 * Speech-recognition accent for live pitches. Values must match SPEECH_LOCALES
 * in the backend (src/services/speechLocale.ts); unknown values are ignored
 * there, so a wrong guess only falls back to the server default.
 */
const TIMEZONE_LOCALES: Record<string, string> = {
  'Africa/Lagos': 'en-NG',
  'Africa/Accra': 'en-GH',
  'Africa/Nairobi': 'en-KE',
  'Africa/Kampala': 'en-KE',
  'Africa/Kigali': 'en-KE',
  'Africa/Dar_es_Salaam': 'en-TZ',
  'Africa/Johannesburg': 'en-ZA',
  'Africa/Harare': 'en-ZA',
  'Africa/Lusaka': 'en-ZA',
  'Europe/London': 'en-GB',
  'Asia/Kolkata': 'en-IN',
  'Asia/Calcutta': 'en-IN',
};

/** Best guess of the founder's English variant from the device timezone. */
export function guessSpeechLocale(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (tz && TIMEZONE_LOCALES[tz]) || undefined;
  } catch {
    return undefined;
  }
}
