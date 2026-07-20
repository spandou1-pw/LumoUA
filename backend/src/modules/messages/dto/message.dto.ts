import { IsArray, IsBase64, IsObject, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  conversationId: string;

  /** Base64-encoded ciphertext produced client-side (doc 26) — server never sees plaintext. */
  @IsBase64()
  ciphertext: string;

  @IsObject()
  ciphertextMeta: Record<string, unknown>;

  /** Client-generated idempotency key so a retried send doesn't duplicate (doc 17 offline queue). */
  @IsString()
  clientMessageId: string;
}

export class PublishDeviceKeysDto {
  @IsString()
  deviceId: string;

  @IsBase64()
  identityKey: string;

  @IsBase64()
  signedPrekey: string;

  @IsBase64()
  signedPrekeySignature: string;

  @IsArray()
  @IsBase64({}, { each: true })
  oneTimePrekeys: string[];
}

export class StartConversationDto {
  @IsUUID()
  recipientId: string;
}
