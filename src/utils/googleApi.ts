export const GOOGLE_API_CONFIG = {
  CLIENT_ID: '794168976403-g75q12b0jv7frnu3vmg920r4i8e7st4m.apps.googleusercontent.com',
  PASTA_ID: '1-3GvrQ8LXVmLuzqqwJ0c_gd0SqVdTPAR',
  SHEET_ID: '1TrewcFAy17S5upNah2_XTGE8liivLGsjzj0y860XpCk',
  SCOPES: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'openid',
    'email'
  ]
};

export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    document.body.appendChild(script);
  });
};

export const getFileByChave = async (accessToken: string, chave: string) => {
  const query = `'${GOOGLE_API_CONFIG.PASTA_ID}' in parents and name contains '${chave}'`;
  
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  
  const data = await res.json();
  return data.files?.[0] || null;
};

export const fetchXmlContent = async (accessToken: string, fileId: string) => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  
  return await res.text();
};