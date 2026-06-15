import type { FC } from "hono/jsx";
import { css, Style } from "hono/css";

const Layout: FC = (props) => {
  const globalClass = css`
    :-hono-global {
      * {
        margin: 0;
        padding: 0;
        user-select: none;
        box-sizing: border-box;
        -webkit-user-drag: none;
      }
      :root {
        --text-color: #000;
        --text-color-gray: #cbcbcb;
        --text-color-hover: #fff;
        --icon-color: #444;
        --status-pending: #8b9291;
        --status-online: #18a058;
        --status-offline: #d03050;
        --status-accent: #b48a3c;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --text-color: #fff;
          --text-color-gray: #cbcbcb;
          --text-color-hover: #3c3c3c;
          --icon-color: #cbcbcb;
          --status-pending: #9ba3a1;
          --status-online: #38d982;
          --status-offline: #ff5a72;
          --status-accent: #d6b35f;
        }
      }
      a {
        text-decoration: none;
        color: var(--text-color);
      }
      body {
        width: 100vw;
        min-height: 100vh;
        overflow-x: hidden;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        color: var(--text-color);
        background-color: var(--text-color-hover);
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei";
        transition:
          color 0.3s,
          background-color 0.3s;
      }
      main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        margin: 20px;
        width: min(100%, 1040px);
        flex: 1;
      }
      .img {
        width: 120px;
        height: 120px;
        margin-bottom: 20px;
      }
      .img img,
      .img svg {
        width: 100%;
        height: 100%;
      }
      .title {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 40px;
      }
      .title .title-text {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 12px;
        text-align: center;
      }
      .title .title-tip {
        font-size: 20px;
        opacity: 0.8;
      }
      .title .content {
        margin-top: 30px;
        display: flex;
        padding: 20px;
        border-radius: 12px;
        border: 1px dashed var(--text-color);
        user-select: text;
      }
      .control {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      .control button {
        display: flex;
        flex-direction: row;
        align-items: center;
        color: var(--text-color);
        border: var(--text-color) solid;
        background-color: var(--text-color-hover);
        border-radius: 8px;
        padding: 8px 12px;
        margin: 0 8px;
        transition:
          color 0.3s,
          background-color 0.3s;
        cursor: pointer;
      }
      .control button .btn-icon {
        width: 22px;
        height: 22px;
        margin-right: 8px;
      }
      .control button .btn-text {
        font-size: 14px;
      }
      .control button:hover {
        border: var(--text-color) solid;
        background: var(--text-color);
        color: var(--text-color-hover);
      }
      .control button i {
        margin-right: 6px;
      }
      .status-panel {
        width: min(100%, 920px);
        margin-top: 34px;
        padding: 18px;
      }
      .status-panel-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 14px;
      }
      .status-kicker {
        font-family: Georgia, "Times New Roman", serif;
        color: var(--status-accent);
        font-size: 11px;
        line-height: 1;
        margin-bottom: 7px;
      }
      .status-panel h2 {
        font-size: 19px;
        line-height: 1.2;
        font-weight: 700;
      }
      #status-summary {
        flex: 0 0 auto;
        min-width: 88px;
        padding: 7px 10px;
        border-radius: 999px;
        color: var(--text-color-gray);
        font-size: 12px;
        line-height: 1;
        text-align: center;
      }
      .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
        gap: 10px;
        overflow: visible;
      }
      .status-card {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 0;
        min-height: 42px;
        padding: 10px 12px;
        border-radius: 8px;
        transition:
          transform 0.25s,
          opacity 0.25s;
      }
      .status-card:hover {
        transform: translateY(-2px);
      }
      .status-name {
        min-width: 0;
        overflow: hidden;
        color: var(--text-color);
        font-size: 13px;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status-dot {
        position: relative;
        flex: 0 0 auto;
        width: 10px;
        height: 10px;
        margin-right: 10px;
        border-radius: 50%;
        background: var(--status-pending);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--status-pending) 40%, transparent);
      }
      .status-dot::after {
        content: "";
        position: absolute;
        inset: -7px;
        border-radius: 50%;
        color: var(--status-pending);
        opacity: 0.42;
        box-shadow: 0 0 0 1px currentColor;
        animation: statusPulse 1.8s ease-out infinite;
      }
      .status-card.is-online {
        opacity: 1;
      }
      .status-card.is-online .status-dot {
        background: var(--status-online);
        box-shadow: 0 0 18px color-mix(in srgb, var(--status-online) 54%, transparent);
      }
      .status-card.is-online .status-dot::after {
        color: var(--status-online);
      }
      .status-card.is-offline {
        opacity: 1;
      }
      .status-card.is-offline .status-dot {
        background: var(--status-offline);
        box-shadow: 0 0 18px color-mix(in srgb, var(--status-offline) 54%, transparent);
      }
      .status-card.is-offline .status-dot::after {
        color: var(--status-offline);
      }
      @keyframes statusPulse {
        0% {
          transform: scale(0.58);
          opacity: 0.46;
        }
        100% {
          transform: scale(1.9);
          opacity: 0;
        }
      }
      @media (max-width: 720px) {
        main {
          justify-content: flex-start;
          margin: 12px;
          padding: 18px 12px;
        }
        .title {
          margin-bottom: 28px;
        }
        .status-panel {
          margin-top: 26px;
          padding: 14px;
        }
        .status-panel-head {
          align-items: flex-start;
        }
        .status-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .status-name {
          font-size: 12px;
        }
      }
      footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 30px;
        padding: 20px;
      }
      .social {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 8px;
      }
      .social .link {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 0 4px;
      }
      .social .link::after {
        content: "";
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--text-color);
        opacity: 0.4;
        margin-left: 8px;
      }
      .social .link:last-child::after {
        display: none;
      }
      .social .link svg {
        width: 22px;
        height: 22px;
      }
      footer .power,
      footer .icp {
        font-size: 14px;
      }
      footer a {
        color: var(--text-color-gray);
        transition: color 0.3s;
      }
      footer a:hover {
        color: var(--text-color);
      }
    }
  `;
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charset="utf-8" />
        <title>{props.title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="今日热榜 API，一个聚合热门数据的 API 接口" />
        <Style>{globalClass}</Style>
      </head>
      <body>
        {props.children}
        <footer>
          <div class="social">
            <a href="https://github.com/willow-god/daily-hot-api" className="link" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                />
              </svg>
            </a>
            <a href="https://www.liushen.fun" className="link" target="_blank">
              <svg
                className="btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1"
                />
              </svg>
            </a>
            <a href="mailto:01@liushen.fun" className="link">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="m20 8l-8 5l-8-5V6l8 5l8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2"
                />
              </svg>
            </a>
          </div>
          <div class="power">
            Copyright&nbsp;©&nbsp;
            <a href="https://www.liushen.fun/" target="_blank">
              清羽飞扬
            </a>
            &nbsp;|&nbsp;Power by&nbsp;
            <a href="https://github.com/honojs/hono/" target="_blank">
              Hono
            </a>
          </div>
          <div class="icp">
            <a href="https://beian.miit.gov.cn/" target="_blank">
              陕ICP备2024028531号-1
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
};

export default Layout;
