/**
 * @module keyword-dictionaries.module
 *
 * Bounded context: editable keyword dictionaries used by scrapers and the
 * LLM matcher.
 */
import { Module } from '@nestjs/common';

import { KEYWORD_DICTIONARY_REPOSITORY } from '../application/ports/keyword-dictionary-repository.port';
import { PostgresKeywordDictionaryRepository } from '../infrastructure/repositories/postgres-keyword-dictionary.repository';
import { KeywordDictionariesController } from './keyword-dictionaries.controller';
import { KeywordDictionariesService } from './keyword-dictionaries.service';

/**
 * Keyword dictionaries bounded-context module.
 */
@Module({
  controllers: [KeywordDictionariesController],
  providers: [
    KeywordDictionariesService,
    {
      provide: KEYWORD_DICTIONARY_REPOSITORY,
      useClass: PostgresKeywordDictionaryRepository,
    },
  ],
})
export class KeywordDictionariesModule {}
