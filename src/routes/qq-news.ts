import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "qq-news",
    title: "腾讯新闻",
    type: "热点榜",
    link: "https://news.qq.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface QQNewsItem {
  id: string;
  title: string;
  abstract: string;
  miniProShareImage: string;
  source: string;
  hotEvent: { hotScore: number };
  timestamp: number;
}

interface QQNewsResponse {
  idlist: [{ newslist: QQNewsItem[] }];
}

const getList = async (noCache: boolean) => {
  const url = `https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50`;
  const result = await get<QQNewsResponse>({ url, noCache });
  const list = result.data.idlist[0].newslist.slice(1);
  return {
    ...result,
    data: list.map((v) => ({
      id: v.id,
      title: v.title,
      desc: v.abstract,
      cover: v.miniProShareImage,
      author: v.source,
      hot: v.hotEvent.hotScore,
      timestamp: getTime(v.timestamp),
      url: `https://new.qq.com/rain/a/${v.id}`,
      mobileUrl: `https://view.inews.qq.com/k/${v.id}`,
    })),
  };
};
