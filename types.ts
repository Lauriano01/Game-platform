export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  profilePic?: string;
  age?: number;
  location?: string;
  interests?: string[];
  sexualPreference?: string;
  datePreference?: string[];
  meetingRequest?: string[];
  // Adicione outras propriedades futuras aqui
}
