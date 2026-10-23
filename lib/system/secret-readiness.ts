export type SecretFeatureStatus = {
  ready: boolean;
  message: string;
};

export function getSecretFeatureStatus(): SecretFeatureStatus {
  const key = process.env.APP_ENCRYPTION_KEY?.trim();

  if (!key) {
    return {
      ready: false,
      message:
        'APP_ENCRYPTION_KEY is not configured. Secret-backed features (automation, AI auto-post) are disabled and will reject requests until it is set. Set APP_ENCRYPTION_KEY in the environment to enable them.',
    };
  }

  return {
    ready: true,
    message: 'Secret storage is ready.',
  };
}
