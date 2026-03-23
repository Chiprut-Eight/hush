import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const MAX_DURATION_SECONDS = 60;

export interface AudioRecording {
  blob: Blob;
  duration: number;
  url: string;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingStartTime = 0;
let timerInterval: ReturnType<typeof setInterval> | null = null;

export async function startRecording(
  onTick: (seconds: number) => void,
  onMaxReached: () => void
): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm',
  });
  audioChunks = [];
  recordingStartTime = Date.now();

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start(100); // collect data every 100ms

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    onTick(elapsed);
    if (elapsed >= MAX_DURATION_SECONDS) {
      onMaxReached();
    }
  }, 1000);
}

export function stopRecording(): Promise<AudioRecording> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No recording in progress'));
      return;
    }

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    mediaRecorder.onstop = () => {
      const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);

      // Stop all tracks
      mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
      mediaRecorder = null;

      resolve({ blob, duration: Math.min(duration, MAX_DURATION_SECONDS), url });
    };

    mediaRecorder.stop();
  });
}

export function cancelRecording(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  }
  mediaRecorder = null;
  audioChunks = [];
}

export async function uploadAudio(blob: Blob, secretId: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage not configured');
  const audioRef = ref(storage, `secrets/${secretId}/audio.webm`);
  await uploadBytes(audioRef, blob);
  return getDownloadURL(audioRef);
}
