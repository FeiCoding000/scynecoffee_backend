import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FirebaseAdminService } from '../infrastructure/firebase/firebase-admin.service';
import { LegacyDrinkOption, LegacyUser } from './legacy.types';

@Injectable()
export class LegacyUsersRepository {
  private readonly collectionName = 'customer';

  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async findByDisplayName(displayName: string): Promise<LegacyUser[]> {
    const normalizedName = this.normalizeDisplayName(displayName);

    if (!normalizedName) {
      throw new BadRequestException('Display name is required');
    }

    const firestore = this.firebaseAdminService.getFirestore();
    const collection = firestore.collection(this.collectionName);
    const normalizedNameSnapshot = await collection
      .where('normalizedName', '==', normalizedName)
      .get();
    const firstNameSnapshot = await collection
      .where('firstName', 'in', this.getFirstNameSearchValues(displayName))
      .get();
    const documents = [
      ...normalizedNameSnapshot.docs,
      ...firstNameSnapshot.docs,
    ];
    const uniqueDocuments = new Map<string, (typeof documents)[number]>();

    for (const document of documents) {
      uniqueDocuments.set(document.id, document);
    }

    return Array.from(uniqueDocuments.values()).map((document) =>
      this.toLegacyUser(document),
    );
  }

  async findById(legacyUserId: string): Promise<LegacyUser | null> {
    const trimmedLegacyUserId = legacyUserId.trim();

    if (!trimmedLegacyUserId) {
      throw new BadRequestException('Legacy user id is required');
    }

    const document = await this.firebaseAdminService
      .getFirestore()
      .collection(this.collectionName)
      .doc(trimmedLegacyUserId)
      .get();

    if (!document.exists) {
      return null;
    }

    return this.toLegacyUser(document as QueryDocumentSnapshot<DocumentData>);
  }

  private normalizeDisplayName(displayName: string): string {
    return displayName.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private getFirstNameSearchValues(displayName: string): string[] {
    const trimmedDisplayName = displayName.trim().replace(/\s+/g, ' ');
    const firstName = trimmedDisplayName.split(' ')[0] ?? trimmedDisplayName;
    const lowerFirstName = firstName.toLowerCase();
    const titleCaseFirstName =
      lowerFirstName.charAt(0).toUpperCase() + lowerFirstName.slice(1);

    return Array.from(new Set([firstName, lowerFirstName, titleCaseFirstName]));
  }

  private toLegacyUser(
    document: QueryDocumentSnapshot<DocumentData>,
  ): LegacyUser {
    const data = document.data();
    const firstName = this.toNullableString(data.firstName);
    const lastName = this.toNullableString(data.lastName);
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || null;

    return {
      legacyUserId: document.id,
      displayName,
      firstName,
      lastName,
      normalizedName: this.toNullableString(data.normalizedName),
      options: this.toLegacyDrinkOptions(data.options),
    };
  }

  private toNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private toLegacyDrinkOptions(value: unknown): LegacyDrinkOption[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (option): option is LegacyDrinkOption =>
        typeof option === 'object' && option !== null,
    );
  }
}
