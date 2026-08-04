import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseAdminService {
  private app?: App;
  private auth?: Auth;
  private firestore?: Firestore;

  constructor(private readonly configService: ConfigService) {}

  verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return this.getAuth().verifyIdToken(idToken);
  }

  getFirestore(): Firestore {
    if (!this.firestore) {
      this.app = this.initializeFirebaseApp();
      this.firestore = getFirestore(this.app);
    }

    return this.firestore;
  }

  private getAuth(): Auth {
    if (!this.auth) {
      this.app = this.initializeFirebaseApp();
      this.auth = getAuth(this.app);
    }

    return this.auth;
  }

  private initializeFirebaseApp(): App {
    const existingApp = getApps()[0];

    if (existingApp) {
      return existingApp;
    }

    const projectId = this.getRequiredConfig('FIREBASE_PROJECT_ID');
    const clientEmail = this.getRequiredConfig('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.getRequiredConfig('FIREBASE_PRIVATE_KEY').replace(
      /\\n/g,
      '\n',
    );

    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`Missing required Firebase config: ${key}`);
    }

    return value;
  }
}
