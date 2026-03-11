import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "tieba",
    title: "百度贴吧",
    type: "热议榜",
    description: "全球领先的中文社区",
    link: "https://tieba.baidu.com/hottopic/browse/topicList",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

interface TiebaItem {
  topic_id: string;
  topic_name: string;
  topic_desc: string;
  topic_pic: string;
  discuss_num: number;
  create_time: string;
  topic_url: string;
}

interface TiebaResponse {
  data: {
    bang_topic: {
      topic_list: TiebaItem[];
    };
  };
}

const getList = async (noCache: boolean) => {
  const url = `https://tieba.baidu.com/hottopic/browse/topicList`;
  const result = await get<TiebaResponse>({ url, noCache });
  const list = result.data.data.bang_topic.topic_list;
  return {
    ...result,
    data: list.map((v) => ({
      id: v.topic_id,
      title: v.topic_name,
      desc: v.topic_desc,
      cover: v.topic_pic,
      hot: v.discuss_num,
      timestamp: getTime(v.create_time),
      url: v.topic_url,
      mobileUrl: v.topic_url,
    })),
  };
};
