import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { recognizeText } from "../../infrastructure/vision/ocr/OcrTextRecognizer";
import { classifyDocument } from "../../infrastructure/vision/ocr/DocumentClassifier";
import { extractFields } from "../../infrastructure/vision/ocr/extractFields";
import { maskAadhaar } from "../../infrastructure/validation/verhoeff";
import { AppError } from "../../domain/errors/app.errors";

export default function CameraScreen() {
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [blockCount, setBlockCount] = useState<number | null>(null);
  const [extractedFields, setExtractedFields] = useState<Array<{ key: string; label: string; value: string; confidence: number }> | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const pickImage = async (source: "camera" | "library") => {
    setLoading(true);
    setErrorCode(null);
    setDocumentType(null);
    setBlockCount(null);
    setExtractedFields(null);

    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setErrorCode("PERMISSION_DENIED");
          setLoading(false);
          return;
        }
      }

      const result = await (source === "camera"
        ? ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images })
        : ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images }));

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const uri = result.assets[0].uri;
      const ocrResult = await recognizeText(uri);
      const type = classifyDocument(ocrResult.text);
      const fields = extractFields(ocrResult.text);

      setDocumentType(type);
      setBlockCount(ocrResult.blocks.length);
      setExtractedFields(fields.map(f => ({
        key: f.key,
        label: f.label,
        value: f.value,
        confidence: f.confidence,
      })));
    } catch (e) {
      if (e instanceof AppError) {
        setErrorCode(e.code);
      } else {
        setErrorCode("IMAGE_UNREADABLE");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDisplayValue = (field: { key: string; value: string }) => {
    if (field.key === "AADHAAR_NO" && field.value) {
      return maskAadhaar(field.value);
    }
    return field.value || "(not detected)";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.75) return "#2e7d32";
    if (confidence >= 0.5) return "#f57c00";
    return "#c62828";
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => pickImage("camera")}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => pickImage("library")}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Pick image</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {errorCode && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {errorCode}</Text>
        </View>
      )}

      {documentType && (
        <View style={styles.resultContainer}>
          <Text style={styles.label}>Document Type: </Text>
          <Text style={styles.value}>{documentType}</Text>
          <Text style={styles.label}>Blocks: </Text>
          <Text style={styles.value}>{blockCount}</Text>
          <Text style={styles.label}>Extracted Fields:</Text>
          <ScrollView style={styles.scrollBox} contentContainerStyle={styles.scrollContent}>
            {extractedFields?.map((field, index) => (
              <View key={index} style={styles.fieldRow}>
                <View style={styles.fieldLabelContainer}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(field.confidence) }]}>
                    {(field.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
                <Text style={styles.fieldValue}>{getDisplayValue(field)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    height: 56,
    backgroundColor: "#007aff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#ffe6e6",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#cc0000",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    color: "#333",
  },
  value: {
    fontSize: 16,
    color: "#000",
    marginBottom: 4,
  },
  scrollBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    maxHeight: 300,
    backgroundColor: "#fafafa",
  },
  scrollContent: {
    padding: 12,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fieldLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  fieldValue: {
    fontSize: 15,
    color: "#111",
    maxWidth: "60%",
    textAlign: "right",
  },
});