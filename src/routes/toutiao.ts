import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "toutiao",
    title: "今日头条",
    type: "热榜",
    link: "https://www.toutiao.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface ToutiaoItem {
  ClusterIdStr: string;
  Title: string;
  Image: { url: string };
  HotValue: string;
}

interface ToutiaoResponse {
  data: ToutiaoItem[];
}

const getList = async (noCache: boolean) => {
  const url = `https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc`;
  const result = await get<ToutiaoResponse>({ url, noCache });
  const list = result.data.data;
  return {
    ...result,
    data: list.map((v) => ({
      id: v.ClusterIdStr,
      title: v.Title,
      cover: v.Image.url,
      timestamp: getTime(v.ClusterIdStr),
      hot: Number(v.HotValue),
      url: `https://www.toutiao.com/trending/${v.ClusterIdStr}/`,
      mobileUrl: `https://api.toutiaoapi.com/feoffline/amos_land/new/html/main/index.html?topic_id=${v.ClusterIdStr}`,
    })),
  };
};
