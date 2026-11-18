export interface GallerySlide {
  id: string;
  title: string;
  images: string[]; // desktop images (up to 4)
  mobileImages: string[]; // mobile images (up to 4)
  googleDriveLink: string;
  createdAt: Date;
}
