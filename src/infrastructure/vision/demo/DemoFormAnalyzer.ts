import type { FormAnalyzer } from "../../../domain/document/document.ports";
import type { FormField, FormInput, FormFieldType } from "../../../domain/form/form.types";
import type { FieldKey } from "../../../domain/document/document.types";

export const DemoFormAnalyzer: FormAnalyzer = {
  async analyze(input: FormInput): Promise<FormField[]> {
    const fields: FormField[] = [
      {
        id: "demo-form-1",
        label: "Full Name",
        key: "FULL_NAME",
        type: "TEXT",
        required: true,
      },
      {
        id: "demo-form-2",
        label: "Father's Name",
        key: "FATHER_NAME",
        type: "TEXT",
        required: true,
      },
      {
        id: "demo-form-3",
        label: "Date of Birth",
        key: "DOB",
        type: "DATE",
        required: true,
      },
      {
        id: "demo-form-4",
        label: "Address",
        key: "ADDRESS",
        type: "TEXT",
        required: true,
      },
      {
        id: "demo-form-5",
        label: "PIN Code",
        key: "PIN_CODE",
        type: "TEXT",
        required: true,
      },
      {
        id: "demo-form-6",
        label: "Phone Number",
        key: "PHONE",
        type: "TEXT",
        required: true,
      },
      {
        id: "demo-form-7",
        label: "Email Address",
        key: "EMAIL",
        type: "TEXT",
        required: false,
      },
      {
        id: "demo-form-8",
        label: "Signature",
        key: "OTHER",
        type: "SIGNATURE",
        required: true,
      },
      {
        id: "demo-form-9",
        label: "Declaration",
        key: "OTHER",
        type: "DECLARATION",
        required: true,
      },
    ];
    return fields;
  },
};