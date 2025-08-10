import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FileInput {
  @Field()
  filename: string;

  @Field()
  mimetype: string;

  @Field()
  data: string; // Base64 encoded file data
}

@InputType()
export class UploadFilesInput {
  @Field()
  subscriptionId: string;

  @Field(() => [FileInput])
  files: FileInput[];
}
