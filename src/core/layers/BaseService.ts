import { Model, PaginateModel, Document } from 'mongoose';

type Repository<Doc extends Document> =
  | Model<Doc>
  | PaginateModel<Doc>
  | { [field: string]: any };

export default class BaseService<Doc extends Document> {
  protected repository: Repository<Doc>;
  constructor(repository: Repository<Doc>) {
    this.repository = repository;
  }

  protected async _populate(docs: any, populates: string[]) {
    console.log('TODO: _populate', populates);

    return docs;
  }

  protected async generateCode(
    text: string,
    options?: { requireUniqueCode?: boolean; dbField?: string },
  ): Promise<string> {
    const opts = {
      dbField: 'code',
      ...options,
    };
    const code = text
      .toString()
      .toLowerCase() //Create URL-Friendly String
      .trim()
      .replace(/[\s_]+/g, '-') // Replace spaces and underscore with -
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\d\-]+/, '') // Remove all special characters
      .replace(/[\-]+/g, '-'); // Replace multiple - with single -

    if (!opts.requireUniqueCode) {
      return code;
    } else {
      //Retrieve the result with the largest number
      const existingCode = await this.repository
        .findOne({ [opts.dbField]: new RegExp(`^${code}(-([0-9]+))?$`, 'i') })
        .sort({ [opts.dbField]: -1 });
      if (!existingCode) {
        return code;
      } else {
        const regex = new RegExp(`^${code}(-([0-9]+))?$`, 'i');
        //An array with the text, -numbers and numbers
        //Ex: existingCode.code = "abc-123"
        //    existingCodeMatched = ["abc", "-123", "123"]
        const existingCodeMatched = existingCode[opts.dbField].match(regex);

        // Check if there are numbers after the text ("123")
        if (existingCodeMatched && !isNaN(parseInt(existingCodeMatched[2]))) {
          // If yes, add 1 to the number (123 => 124)
          const codify = `${code}-${(parseInt(existingCodeMatched[2], 10) + 1)
            .toString()
            .padStart(2, '0')}`;
          return codify;
        } else {
          // Otherwise, assign a number (-1)
          return `${code}-01`;
        }
      }
    }
  }
}
