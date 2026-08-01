import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, DecodedIdToken, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  private app?: App;
  private auth?: Auth;

  constructor(private readonly configService: ConfigService) {}

  verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return this.getAuth().verifyIdToken(idToken);
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
