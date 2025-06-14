export interface DirectMessage {
  id: string;
  content: string[];
  creationTime: number;
  fromCurrentUser: boolean;
}
