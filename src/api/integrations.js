import { supabase } from './supabaseClient';

// Integration helpers using Supabase Edge Functions
export const Core = {
  InvokeLLM: async (data) => {
    const { data: result, error } = await supabase.functions.invoke('invoke-llm', { body: data });
    if (error) throw error;
    return result;
  },
  SendEmail: async (data) => {
    const { data: result, error } = await supabase.functions.invoke('send-email', { body: data });
    if (error) throw error;
    return result;
  },
  UploadFile: async (file, bucket = 'uploads') => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    return data;
  },
  GenerateImage: async (data) => {
    const { data: result, error } = await supabase.functions.invoke('generate-image', { body: data });
    if (error) throw error;
    return result;
  },
  ExtractDataFromUploadedFile: async (data) => {
    const { data: result, error } = await supabase.functions.invoke('extract-data-from-file', { body: data });
    if (error) throw error;
    return result;
  }
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;






