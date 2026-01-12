import { createApi } from 'unsplash-js';

// 应用名称，用于 UTM 参数
const APP_NAME = 'tiktok_flow';

// 创建 Unsplash API 实例
const unsplash = createApi({
  accessKey: 'moweyBVLsKlHQOCFiZyCTBu5TFJFLaqUpNc67Ml6HSw',
});

// 壁纸数据类型，包含图片 URL 和归属信息
export interface WallpaperData {
  url: string;
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
}

/**
 * 生成带 UTM 参数的 URL
 */
function addUtmParams(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=${APP_NAME}&utm_medium=referral`;
}

/**
 * 获取随机壁纸图片
 * @param query 可选的搜索关键词，用于获取特定主题的图片
 * @returns 返回壁纸数据（图片 URL 和归属信息）或 null
 */
export async function getRandomWallpaper(
  query?: string,
): Promise<WallpaperData | null> {
  // 备用壁纸列表 - 高质量的 Unsplash 静态图片
  const fallbackWallpapers: WallpaperData[] = [
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&fit=max',
      photographerName: 'Samuel Ferrara',
      photographerUrl: addUtmParams('https://unsplash.com/@samferrara'),
      unsplashUrl: addUtmParams('https://unsplash.com'),
    },
    {
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80&fit=max',
      photographerName: 'Kalen Emsley',
      photographerUrl: addUtmParams('https://unsplash.com/@kalenemsley'),
      unsplashUrl: addUtmParams('https://unsplash.com'),
    },
    {
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80&fit=max',
      photographerName: 'Luca Bravo',
      photographerUrl: addUtmParams('https://unsplash.com/@lucabravo'),
      unsplashUrl: addUtmParams('https://unsplash.com'),
    },
    {
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80&fit=max',
      photographerName: 'Lukasz Szmigiel',
      photographerUrl: addUtmParams('https://unsplash.com/@szmigieldesign'),
      unsplashUrl: addUtmParams('https://unsplash.com'),
    },
    {
      url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80&fit=max',
      photographerName: 'Patrick Tomasso',
      photographerUrl: addUtmParams('https://unsplash.com/@impatrickt'),
      unsplashUrl: addUtmParams('https://unsplash.com'),
    },
  ];

  try {
    const result = await unsplash.photos.getRandom({
      query: query || 'nature landscape',
      orientation: 'landscape',
      count: 1,
    });

    if (result.type === 'success') {
      // 当 count=1 时，返回的是单个对象而不是数组
      const photo = Array.isArray(result.response)
        ? result.response[0]
        : result.response;

      // 使用 raw URL 并指定宽度参数获取 1920px 宽度的高质量壁纸
      const imageUrl = `${photo.urls.raw}&w=1920&q=80&fit=max`;

      return {
        url: imageUrl,
        photographerName: photo.user.name,
        photographerUrl: addUtmParams(photo.user.links.html),
        unsplashUrl: addUtmParams('https://unsplash.com'),
      };
    }

    console.warn('Unsplash API 返回错误，使用备用壁纸');
    return fallbackWallpapers[
      Math.floor(Math.random() * fallbackWallpapers.length)
    ];
  } catch (error) {
    console.warn('Unsplash API 调用失败，使用备用壁纸:', error);
    return fallbackWallpapers[
      Math.floor(Math.random() * fallbackWallpapers.length)
    ];
  }
}

/**
 * 搜索壁纸图片
 * @param query 搜索关键词
 * @param page 页码
 * @param perPage 每页数量
 * @returns 返回图片 URL 数组
 */
export async function searchWallpapers(
  query: string,
  page = 1,
  perPage = 10,
): Promise<string[]> {
  try {
    const result = await unsplash.search.getPhotos({
      query,
      page,
      perPage,
      orientation: 'landscape',
    });

    if (result.type === 'success') {
      // 使用 raw URL 并指定宽度参数获取 1920px 宽度的图片
      return result.response.results.map(
        (photo) => `${photo.urls.raw}&w=1920&q=80&fit=max`,
      );
    }

    console.error('搜索 Unsplash 图片失败:', result.errors);
    return [];
  } catch (error) {
    console.error('Unsplash 搜索 API 调用失败:', error);
    return [];
  }
}

export { unsplash };
