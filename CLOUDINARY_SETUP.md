# Configuration Cloudinary pour SMS2I E-Learning

## Prérequis

Vous avez besoin d'un compte Cloudinary avec les credentials suivants:
- **Cloud name**: dqbs0mtfh
- **API key**: 421218222957841
- **API secret**: NbDWjB7UakA6PNhe0LmEBfcDt8Q

## Configuration de l'Upload Preset

Pour permettre les uploads depuis le frontend, vous devez créer un **Upload Preset** dans Cloudinary:

### Étapes:

1. **Connectez-vous à votre compte Cloudinary**
   - Allez sur: https://cloudinary.com/console

2. **Accédez aux Settings**
   - Cliquez sur l'icône d'engrenage (Settings) en haut à droite

3. **Ouvrez la page Upload**
   - Dans le menu de gauche, cliquez sur "Upload"
   - Faites défiler jusqu'à "Upload presets"

4. **Créez un nouveau preset**
   - Cliquez sur "Add upload preset"
   - Configurez comme suit:
     - **Preset name**: `ml_default` (ou un autre nom de votre choix)
     - **Signing Mode**: `Unsigned` (important pour les uploads frontend)
     - **Folder**: Laissez vide (le dossier sera défini dans le code)
     - **Use filename**: Cochez si vous voulez garder les noms de fichiers originaux
     - **Unique filename**: Cochez pour éviter les conflits de noms

5. **Configurez les transformations (optionnel)**
   - Dans "Incoming Transformation":
     - Pour les images: Vous pouvez ajouter une transformation pour optimiser (ex: `q_auto,f_auto`)
     - Pour les vidéos: Laissez vide pour le moment

6. **Sauvegardez le preset**
   - Cliquez sur "Save"

7. **Mettez à jour le code**
   - Si vous avez utilisé un nom différent de `ml_default`, mettez à jour:
     - `src/environments/environment.ts`
     - `src/environments/environment.prod.ts`
   - Changez la valeur de `uploadPreset` avec votre nom de preset

## Structure des dossiers Cloudinary

Les fichiers seront organisés comme suit:
```
courses/
  ├── images/     # Images des cours
  ├── videos/     # Vidéos des cours
  └── documents/  # PDFs et autres documents
```

## Limites de taille

- **Images**: 10 MB maximum
- **PDFs**: 50 MB maximum
- **Vidéos**: 500 MB maximum

Ces limites peuvent être modifiées dans `src/app/services/file-upload.service.ts`

## Sécurité

### Pour la production:

1. **Ne jamais exposer l'API Secret dans le frontend**
   - L'API Secret (`NbDWjB7UakA6PNhe0LmEBfcDt8Q`) ne doit JAMAIS être dans le code frontend
   - Il est utilisé uniquement pour les opérations côté serveur

2. **Utiliser un Upload Preset Unsigned**
   - C'est la méthode sécurisée pour uploader depuis le frontend

3. **Configurer les restrictions dans Cloudinary**
   - Allez dans Settings > Security
   - Ajoutez votre domaine dans "Allowed fetch domains"
   - Limitez les formats de fichiers acceptés

4. **Implémenter la suppression côté serveur**
   - La suppression de fichiers nécessite une signature
   - Créez un endpoint backend pour gérer les suppressions

## Utilisation dans le code

Les services sont déjà configurés:

```typescript
// Upload d'une image
this.fileUploadService.uploadImage(file).subscribe(result => {
  if (result.success) {
    console.log('URL:', result.url);
    console.log('Public ID:', result.publicId);
  }
});

// Upload d'une vidéo
this.fileUploadService.uploadVideo(file).subscribe(result => {
  // ...
});

// Upload d'un PDF
this.fileUploadService.uploadPdf(file).subscribe(result => {
  // ...
});
```

## Fonctionnalités avancées

### Optimisation d'images
```typescript
const optimizedUrl = this.fileUploadService.getOptimizedImageUrl(publicId, 800, 600);
```

### Thumbnail de vidéo
```typescript
const thumbnail = this.fileUploadService.getVideoThumbnail(publicId);
```

## Dépannage

### Erreur: "Upload preset not found"
- Vérifiez que vous avez créé le preset `ml_default`
- Vérifiez que le preset est en mode "Unsigned"

### Erreur: "Invalid cloud name"
- Vérifiez que `cloudName` dans `environment.ts` est correct

### Erreur CORS
- Vérifiez que votre domaine est autorisé dans Cloudinary Settings > Security

### Les uploads sont lents
- Vérifiez votre connexion internet
- Pour les vidéos volumineuses, considérez la compression avant upload

## Support

Pour plus d'informations:
- Documentation Cloudinary: https://cloudinary.com/documentation
- Upload Widget: https://cloudinary.com/documentation/upload_widget
