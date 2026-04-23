import type { RouterData, RouterResType } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "csdn",
    title: "CSDN",
    type: "排行榜",
    description: "专业开发者社区",
    link: "https://www.csdn.net/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface CsdnItem {
  productId: string;
  articleTitle: string;
  picList?: string[];
  nickName: string;
  period: string;
  hotRankScore: number;
  articleDetailUrl: string;
}

interface CsdnResponse {
  data: CsdnItem[];
}

const getList = async (noCache: boolean): Promise<RouterResType> => {
  const url = "https://blog.csdn.net/phoenix/web/blog/hot-rank?page=0&pageSize=30";
  const result = await get<CsdnResponse>({ url, noCache });
  const list = result.data.data;
  return {
    ...result,
    data: list.map((v) => ({
      id: v.productId,
      title: v.articleTitle,
      cover: v.picList?.[0] || undefined,
      desc: undefined,
      author: v.nickName,
      timestamp: getTime(v.period),
      hot: Number(v.hotRankScore),
      url: v.articleDetailUrl,
      mobileUrl: v.articleDetailUrl,
    })),
  };
};
