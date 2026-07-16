import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Prompt user to select screen to share (and optionally system audio)
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: true
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `interview-recording-${new Date().getTime()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        recordedChunksRef.current = [];
        setIsRecording(false);
        toast.success('Recording saved to your device.');
      };

      // Stop recording when the user clicks "Stop Sharing" on the browser native bar
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      toast.error('Could not start screen recording. Permission denied.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
}
