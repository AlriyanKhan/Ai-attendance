import { ImageAnnotatorClient } from '@google-cloud/vision';

interface FaceDetectionResult {
  detectionConfidence: number;
  joyLikelihood: string;
  angerLikelihood: string;
  sorrowLikelihood: string;
  surpriseLikelihood: string;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

class VisionAIService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || '';
    this.apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';
  }

  async detectFaces(imageData: string): Promise<FaceDetectionResult[]> {
    try {
      // Remove the data URL prefix if present
      const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
      
      // Create a promise with timeout
      const fetchWithTimeout = async (timeoutMs = 10000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
          const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [{
                image: {
                  content: base64Image
                },
                features: [{
                  type: 'FACE_DETECTION',
                  maxResults: 10
                }]
              }]
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Vision API error: ${response.statusText}`);
          }
          
          return response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Vision API request timed out after ' + timeoutMs + 'ms');
          }
          throw error;
        }
      };
      
      console.log('Starting Vision AI face detection with timeout...');
      const data = await fetchWithTimeout();
      console.log('Vision API response received:', data);
      
      const faces = data.responses[0]?.faceAnnotations || [];
      
      return faces.map((face: any) => ({
        detectionConfidence: face.detectionConfidence || 0,
        joyLikelihood: face.joyLikelihood || 'UNKNOWN',
        angerLikelihood: face.angerLikelihood || 'UNKNOWN',
        sorrowLikelihood: face.sorrowLikelihood || 'UNKNOWN',
        surpriseLikelihood: face.surpriseLikelihood || 'UNKNOWN',
        bounds: face.boundingPoly?.vertices?.[0]
          ? {
              left: face.boundingPoly.vertices[0].x || 0,
              top: face.boundingPoly.vertices[0].y || 0,
              right: face.boundingPoly.vertices[2].x || 0,
              bottom: face.boundingPoly.vertices[2].y || 0,
            }
          : { left: 0, top: 0, right: 0, bottom: 0 }
      }));
    } catch (error) {
      console.error('Error in face detection:', error);
      // Return an empty array instead of throwing to allow the process to continue
      return [];
    }
  }

  async compareFaces(face1Buffer: Buffer, face2Buffer: Buffer) {
    try {
      const face1Base64 = face1Buffer.toString('base64');
      const face2Base64 = face2Buffer.toString('base64');
      
      const [face1Results, face2Results] = await Promise.all([
        this.detectFaces(face1Base64),
        this.detectFaces(face2Base64)
      ]);

      // Simple comparison based on facial features
      if (!face1Results.length || !face2Results.length) {
        return { isMatch: false, confidence: 0 };
      }

      // Compare facial features (this is a basic example)
      const face1 = face1Results[0];
      const face2 = face2Results[0];

      const confidenceMatch = Math.abs(face1.detectionConfidence - face2.detectionConfidence) < 0.2;
      const emotionMatch = face1.joyLikelihood === face2.joyLikelihood;

      return {
        isMatch: confidenceMatch && emotionMatch,
        confidence: (face1.detectionConfidence + face2.detectionConfidence) / 2,
      };
    } catch (error) {
      console.error('Error comparing faces:', error);
      throw error;
    }
  }
}

export const visionAIService = new VisionAIService();
export default visionAIService; 