import type { RouterData, ListContext, Options, RouterResType } from "../types.js";
import { get } from "../utils/getData.js";

const typeMap: Record<string, string> = {
  realtime: "热搜",
  novel: "小说",
  movie: "电影",
  teleplay: "电视剧",
  car: "汽车",
  game: "游戏",
};

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = c.req.query("type") || "realtime";
  const listData = await getList({ type }, noCache);
  const routeData: RouterData = {
    name: "baidu",
    title: "百度",
    type: typeMap[type],
    params: {
      type: {
        name: "热搜类别",
        type: typeMap,
      },
    },
    link: "https://top.baidu.com/board",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface BaiduItem {
  index?: number;
  word?: string;
  title?: string;
  desc?: string;
  img?: string;
  imgInfo?: { src: string };
  show?: string;
  hotScore?: string;
  hotTag?: string;
  query?: string;
  rawUrl?: string;
  url?: string;
  content?: BaiduItem[];
}

interface BaiduSData {
  data?: { cards?: Array<{ content?: BaiduItem[] }> };
  cards?: Array<{ content?: BaiduItem[] }>;
}

const getList = async (options: Options, noCache: boolean): Promise<RouterResType> => {
  const { type } = options;
  const url = `https://top.baidu.com/board?tab=${type}`;
  const result = await get<string>({
    url,
    noCache,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    },
  });
  // 正则查找
  const pattern = /<!--s-data:(.*?)-->/s;
  const matchResult = result.data.match(pattern);
  if (!matchResult) {
    return {
      ...result,
      data: [],
    };
  }
  let jsonObject: BaiduItem[] = [];
  try {
    const sData: BaiduSData = JSON.parse(matchResult[1]);
    const cardContent = sData.data?.cards?.[0]?.content ?? sData.cards?.[0]?.content;
    if (Array.isArray(cardContent)) {
      if (cardContent.length > 0 && Array.isArray(cardContent[0]?.content)) {
        jsonObject = cardContent[0].content!;
      } else {
        jsonObject = cardContent;
      }
    }
  } catch {
    jsonObject = [];
  }
  return {
    ...result,
    data: jsonObject.map((v, index: number) => {
      const title = v.word ?? v.title ?? "";
      return {
        id: v.index ?? index + 1,
        title,
        desc: v.desc ?? "",
        cover: v.img ?? v.imgInfo?.src ?? "",
        author: v.show?.length ? v.show : "",
        timestamp: 0,
        hot: parseInt((v.hotScore ?? v.hotTag ?? "0").toString(), 10) || 0,
        url: `https://www.baidu.com/s?wd=${encodeURIComponent(v.query ?? title)}`,
        mobileUrl: v.rawUrl ?? v.url ?? "",
      };
    }),
  };
};
