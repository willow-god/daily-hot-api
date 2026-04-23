import type { RouterData, ListContext, Options } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const sort = c.req.query("sort") || "featured";
  const listData = await getList({ sort }, noCache);
  const routeData: RouterData = {
    name: "hellogithub",
    title: "HelloGitHub",
    type: "热门仓库",
    description: "分享 GitHub 上有趣、入门级的开源项目",
    params: {
      sort: {
        name: "排行榜分区",
        type: {
          featured: "精选",
          all: "全部",
        },
      },
    },
    link: "https://hellogithub.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface HelloGithubItem {
  item_id: string;
  title: string;
  summary: string;
  author: string;
  updated_at: string;
  clicks_total: number;
}

interface HelloGithubResponse {
  data: HelloGithubItem[];
}

const getList = async (options: Options, noCache: boolean) => {
  const { sort } = options;
  const url = `https://abroad.hellogithub.com/v1/?sort_by=${sort}&tid=&page=1`;
  const result = await get<HelloGithubResponse>({ url, noCache });
  const list = result.data.data;
  return {
    ...result,
    data: list.map((v) => ({
      id: v.item_id,
      title: v.title,
      desc: v.summary,
      author: v.author,
      timestamp: getTime(v.updated_at),
      hot: v.clicks_total,
      url: `https://hellogithub.com/repository/${v.item_id}`,
      mobileUrl: `https://hellogithub.com/repository/${v.item_id}`,
    })),
  };
};
