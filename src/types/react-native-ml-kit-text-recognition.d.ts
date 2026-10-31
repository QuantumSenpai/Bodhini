declare module "@react-native-ml-kit/text-recognition" {
  export interface Frame {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  export interface TextLine {
    text: string;
    frame?: Frame;
  }

  export interface TextBlock {
    text: string;
    frame?: Frame;
    lines: TextLine[];
  }

  export interface TextRecognitionResult {
    text: string;
    blocks: TextBlock[];
  }

  const TextRecognition: {
    recognize(imageUri: string): Promise<TextRecognitionResult>;
  };

  export default TextRecognition;
}
