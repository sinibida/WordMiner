export interface WordDto {
  word: string
  phonetics: PhoneticDto[]
  meanings: MeaningDto[]
  license: LicenseDto
  sourceUrls: string[]
}

export interface PhoneticDto {
  audio: string
  sourceUrl?: string
  license?: LicenseDto
  text?: string
}

export interface LicenseDto {
  name: string
  url: string
}

export interface MeaningDto {
  partOfSpeech: string
  definitions: DefinitionDto[]
  synonyms: string[]
  antonyms: string[]
}

export interface DefinitionDto {
  definition: string
  synonyms: string[]
  antonyms: string[]
  example?: string
}
