import { createApi } from "unsplash-js";

// 创建 Unsplash API 实例
const unsplash = createApi({
  accessKey: "moweyBVLsKlHQOCFiZyCTBu5TFJFLaqUpNc67Ml6HSw",
});

/**
 * 获取随机壁纸图片
 * @param query 可选的搜索关键词，用于获取特定主题的图片
 * @returns 返回图片的 URL 或 null
 */
export async function getRandomWallpaper(
  query?: string
): Promise<string | null> {
  try {
    const result = await unsplash.photos.getRandom({
      query: query || "nature landscape",
      orientation: "landscape",
      count: 1,
    });

    if (result.type === "success") {
      // 当 count=1 时，返回的是单个对象而不是数组
      const photo = Array.isArray(result.response)
        ? result.response[0]
        : result.response;

      // 使用 raw URL 并指定宽度参数获取 1920px 宽度的高质量壁纸
      // raw URL 支持自定义参数: w (宽度), h (高度), q (质量 0-100), fit (裁剪方式)
      return `${photo.urls.raw}&w=1920&q=80&fit=max`;
    }

    console.error("获取 Unsplash 图片失败:", result.errors);
    return null;
  } catch (error) {
    console.error("Unsplash API 调用失败:", error);
    return null;
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
  perPage = 10
): Promise<string[]> {
  try {
    const result = await unsplash.search.getPhotos({
      query,
      page,
      perPage,
      orientation: "landscape",
    });

    if (result.type === "success") {
      // 使用 raw URL 并指定宽度参数获取 1920px 宽度的图片
      return result.response.results.map(
        (photo) => `${photo.urls.raw}&w=1920&q=80&fit=max`
      );
    }

    console.error("搜索 Unsplash 图片失败:", result.errors);
    return [];
  } catch (error) {
    console.error("Unsplash 搜索 API 调用失败:", error);
    return [];
  }
}

export { unsplash };
