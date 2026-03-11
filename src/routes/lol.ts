import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "lol",
    title: "英雄联盟",
    type: "更新公告",
    link: "https://lol.qq.com/gicp/news/423/2/1334/1.html",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface LolItem {
  iDocID: string;
  sTitle: string;
  sIMG: string;
  sAuthor: string;
  iTotalPlay: string;
  sCreated: string;
}

interface LolResponse {
  data: {
    result: LolItem[];
  };
}

const getList = async (noCache: boolean) => {
  const url =
    "https://apps.game.qq.com/cmc/zmMcnTargetContentList?r0=json&page=1&num=30&target=24&source=web_pc";
  const result = await get<LolResponse>({ url, noCache });
  const list = result.data.data.result;
  return {
    ...result,
    data: list.map((v) => ({
      id: v.iDocID,
      title: v.sTitle,
      cover: `https:${v.sIMG}`,
      author: v.sAuthor,
      hot: Number(v.iTotalPlay),
      timestamp: getTime(v.sCreated),
      url: `https://lol.qq.com/news/detail.shtml?docid=${encodeURIComponent(v.iDocID)}`,
      mobileUrl: `https://lol.qq.com/news/detail.shtml?docid=${encodeURIComponent(v.iDocID)}`,
    })),
  };
};
