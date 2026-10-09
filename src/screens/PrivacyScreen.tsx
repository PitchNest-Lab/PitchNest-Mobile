import React from 'react';
import { Linking, Pressable, Text } from 'react-native';
import { LegalScreen, LegalSection } from '../components/LegalScreen';
import { CONTACT_EMAIL, MIN_AGE, PRIVACY_URL } from '../constants/legal';

export default function PrivacyScreen() {
  return (
    <LegalScreen title="Privacy Policy">
      <LegalSection title="Overview">
        PitchNest helps founders practice pitches with AI-generated investor personas on iOS and Android.
        This policy explains what we collect, how we use it, and how to delete your data.
      </LegalSection>
      <LegalSection title="Information we collect">
        Account data (name, email, hashed password), profile data (startup name, industry, goals), pitch decks,
        session transcripts, AI evaluation reports, and any AI responses you choose to report to us.
      </LegalSection>
      <LegalSection title="Microphone and camera">
        Your voice is streamed during a live pitch so it can be transcribed and answered; the mobile app does not
        store audio recordings. The optional camera shows a private preview on your device only — video is never
        recorded, uploaded, or sent to AI.
      </LegalSection>
      <LegalSection title="AI processing">
        Live conversations and evaluations are generated with Microsoft Azure OpenAI, and speech is transcribed and
        voiced with Microsoft Azure AI Speech. Your words, transcript, startup details, and deck text are sent to these
        services to produce responses. Microsoft does not use this data to train its models. AI responses are
        generated — not real investors or financial advice.
      </LegalSection>
      <LegalSection title="Third-party services">
        Microsoft Azure (AI and speech), Supabase (database and file storage), Amazon Web Services and Render
        (backend hosting), Vercel (website), Resend (account emails), and Google Docs Viewer (to display PDF
        deck slides in the app). If market research is enabled, your startup name
        and description may be sent to a web search provider to find competitors.
      </LegalSection>
      <LegalSection title="Your choices">
        Update profile in Settings, revoke camera/microphone in device settings, or delete your account in Profile.
        Contact {CONTACT_EMAIL} for privacy requests.
      </LegalSection>
      <LegalSection title="Children">
        PitchNest is not directed at children under {MIN_AGE}. We do not knowingly collect data from users under {MIN_AGE}.
      </LegalSection>
      <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
        <Text style={{ color: '#0ea5e9', fontWeight: '700' }}>View full policy online</Text>
      </Pressable>
    </LegalScreen>
  );
}
