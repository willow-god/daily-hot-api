import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "thepaper",
    title: "澎湃新闻",
    type: "热榜",
    link: "https://www.thepaper.cn/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface ThepaperItem {
  contId: string;
  name: string;
  pic: string;
  praiseTimes: string;
  pubTimeLong: number;
}

interface ThepaperResponse {
  data: {
    hotNews: ThepaperItem[];
  };
}

const getList = async (noCache: boolean) => {
  const url = `https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar`;
  const result = await get<ThepaperResponse>({ url, noCache });
  const list = result.data.data.hotNews;
  return {
    ...result,
    data: list.map((v) => ({
      id: v.contId,
      title: v.name,
      cover: v.pic,
      hot: Number(v.praiseTimes),
      timestamp: getTime(v.pubTimeLong),
      url: `https://www.thepaper.cn/newsDetail_forward_${v.contId}`,
      mobileUrl: `https://m.thepaper.cn/newsDetail_forward_${v.contId}`,
    })),
  };
};
