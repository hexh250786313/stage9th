import React, { useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import useSWR from "swr";
import "./App.css";

// 类型定义
interface Post {
  id: number;
  subject: string;
  created: number;
  last_updated: number;
  views: number;
  replies: number;
  scores: number;
  votes: number;
  standard_deviation: number;
  average_score: number;
  bayesian_average_score: number;
}

type SortField = "votes" | "average_score" | "bayesian_average_score";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const MovieLink = styled.a`
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: #4caf50;
  }
`;

const generateThreadUrl = (id: number) =>
  `https://bbs.saraba1st.com/2b/thread-${id}-1-1.html`;

const SortableHeader = styled.th<{ sortable?: boolean }>`
  cursor: ${(props) => (props.sortable ? "pointer" : "default")};
  position: relative;
  padding-right: ${(props) => (props.sortable ? "24px" : "8px")} !important;

  &:hover {
    background-color: ${(props) => (props.sortable ? "#e6e6e6" : "#f4f4f4")};
  }

  &::after {
    content: ${(props) => (props.sortable ? "'↕'" : "none")};
    position: absolute;
    right: 8px;
    opacity: 0.5;
  }

  &[data-sort-direction="asc"]::after {
    content: "↑";
    opacity: 1;
  }

  &[data-sort-direction="desc"]::after {
    content: "↓";
    opacity: 1;
  }
`;

const ScrollToTopButton = styled.button<{
  visible: boolean;
}>`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: grey;
  color: rgba(0, 0, 0, 0.8);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.3s,
    background-color 0.3s;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  pointer-events: ${(props) => (props.visible ? "auto" : "none")};

  &:hover {
    background-color: white;
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    translate: 0 10px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 样式组件定义
const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const FilterSection = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
`;

const Select = styled.select`
  padding: 8px;
  border-radius: 4px;
  min-width: 120px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: rgba(0, 0, 0, 0.6);
  }
`;

const TableRow = styled.tr<{ visible: boolean }>`
  opacity: 0;
  ${(props) =>
    props.visible &&
    css`
      animation: ${fadeIn} 0.5s ease forwards;
    `}
`;

const TableRowWithAnimation = ({
  children,
}: {
  children: React.ReactNode;
  index: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      },
    );

    if (rowRef.current) {
      observer.observe(rowRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <TableRow ref={rowRef} visible={isVisible}>
      {children}
    </TableRow>
  );
};

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  color: red;
  text-align: center;
  padding: 20px;
`;

const TabContainer = styled.div`
  margin-bottom: 20px;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  margin-right: 10px;
  border: none;
  background-color: ${(props) => (props.active ? "#4CAF50" : "#f0f0f0")};
  color: ${(props) => (props.active ? "white" : "black")};
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: ${(props) => (props.active ? "#45a049" : "#e0e0e0")};
  }
`;

// fetcher 函数
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const VisualizationContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
  gap: 16px;
  will-change: contents;
`;

const calculateColor = (score: number) => {
  const normalizedScore = Math.max(0, Math.min(1, (score + 2) / 4));
  return `rgb(${Math.round(255 * normalizedScore)}, 0, ${Math.round(255 * (1 - normalizedScore))})`;
};

const MovieTitle = styled.a<{ fontSize: number; score: number; index: number }>`
  font-size: ${(props) => props.fontSize}px;
  color: ${(props) => calculateColor(props.score)};
  text-align: center;
  cursor: pointer;
  transition: scale 0.2s;
  animation: ${fadeInUp} 0.5s ease forwards;
  animation-delay: ${(props) => props.index * 0.03}s;
  opacity: 0;
  text-decoration: none;

  &:hover {
    scale: 1.1;
    text-decoration: underline;
    color: ${(props) => calculateColor(props.score)};
  }

  &:link,
  &:visited,
  &:active {
    color: ${(props) => calculateColor(props.score)};
  }
`;

const VisualizationView = ({ posts }: { posts: Post[] }) => {
  // 先按投票人数排序
  const sortedPosts = [...posts].sort((a, b) => b.votes - a.votes).slice(0, 75); // 只取前30个

  // 计算字体大小范围
  const firstPlaceFontSize = 64; // 排名第一使用更大字号
  const maxFontSize = 48; // 第二名开始的最大字号
  const minFontSize = 12; // 略微调整最小字号

  // 使用非线性计算使字体大小的变化更明显
  const calculateFontSize = (index: number) => {
    // 排名第一使用特殊字号
    if (index === 0) {
      return firstPlaceFontSize;
    }

    // 使用指数衰减使前面的差异更大
    const factor = Math.exp(-(index - 1) / 25); // index-1 因为第二名开始算
    return Math.max(minFontSize, Math.round(maxFontSize * factor));
  };

  const processMovieTitle = (subject: string): string => {
    // 先移除年份和类型标记
    const titleOnly = subject.replace(/\[\d{4}\.\d+\](\[.*?\])?/, "").trim();

    // 计算分隔符的数量
    const separatorCount = (titleOnly.match(/[/／]/g) || []).length;

    // 如果只有一个分隔符，返回完整标题
    if (separatorCount === 1) {
      return titleOnly;
    }

    // 如果有多个分隔符或没有分隔符，只返回第一部分
    return titleOnly.split(/[/／]/)[0].trim();
  };

  return (
    <VisualizationContainer
      key={sortedPosts.map((p) => p.id).join(",")} // 添加key强制重新渲染
    >
      {sortedPosts.map((post, index) => {
        // 计算字体大小（根据排序位置线性递减）
        const fontSize = calculateFontSize(index);

        // 从标题中提取电影名（去掉年份等信息）
        const movieName = processMovieTitle(post.subject);

        return (
          <MovieTitle
            key={post.id}
            fontSize={fontSize}
            score={post.average_score}
            title={`投票数: ${post.votes}, 平均分: ${post.average_score.toFixed(2)}`}
            index={index}
            href={generateThreadUrl(post.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {movieName}
          </MovieTitle>
        );
      })}
    </VisualizationContainer>
  );
};

function App() {
  const {
    data: posts,
    error,
    isLoading,
  } = useSWR<Post[]>("https://stage9th-source.hexh.xyz", fetcher);

  const getAvailableYears = (posts: Post[] | undefined): number[] => {
    if (!posts || posts.length === 0) return [new Date().getFullYear()];

    const yearsSet = new Set<number>();
    posts.forEach((post) => {
      const match = post.subject.match(/\[(\d{4})\./);
      if (match) {
        yearsSet.add(parseInt(match[1]));
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a); // 降序排列
  };

  const [year, setYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"table" | "other">("table");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sort, setSort] = useState<SortState>({
    field: "bayesian_average_score",
    direction: "desc",
  });

  const handleSort = (field: SortField) => {
    setSort((prevSort) => ({
      field,
      direction:
        prevSort.field === field && prevSort.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const getSortedPosts = (posts: Post[]) => {
    const filteredPosts = filterPosts(posts);
    return [...filteredPosts].sort((a, b) => {
      const multiplier = sort.direction === "desc" ? -1 : 1;
      return (a[sort.field] - b[sort.field]) * multiplier;
    });
  };

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300); // 滚动超过300px显示按钮
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const years = getAvailableYears(posts);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(e.target.value);
  };

  const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuarter(e.target.value);
    setMonth(""); // 清空月份
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(e.target.value);
    setQuarter(""); // 清空季度
  };

  const filterPosts = (posts: Post[] | undefined) => {
    if (!posts) return [];

    return posts.filter((post) => {
      const match = post.subject.match(/\[(\d{4})\.(\d{1,2})\]/);
      if (!match) return false;

      const postYear = match[1];
      const postMonth = parseInt(match[2], 10);

      if (year && postYear !== year) return false;

      if (quarter) {
        const quarterMap = {
          Q1: [1, 2, 3],
          Q2: [4, 5, 6],
          Q3: [7, 8, 9],
          Q4: [10, 11, 12],
        };
        if (!quarterMap[quarter as keyof typeof quarterMap].includes(postMonth))
          return false;
      }

      if (month && postMonth !== parseInt(month)) return false;

      return true;
    });
  };

  if (error) return <ErrorMessage>Failed to load data</ErrorMessage>;
  if (isLoading) return <LoadingMessage>Loading...</LoadingMessage>;
  const rows = getSortedPosts(posts || []);

  return (
    <Container>
      <FilterSection>
        <div>
          <label>年份：</label>
          <Select value={year} onChange={handleYearChange}>
            <option value="">全部</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label>季度：</label>
          <Select value={quarter} onChange={handleQuarterChange}>
            <option value="">全部</option>
            <option value="Q1">一季度 (1-3月)</option>
            <option value="Q2">二季度 (4-6月)</option>
            <option value="Q3">三季度 (7-9月)</option>
            <option value="Q4">四季度 (10-12月)</option>
          </Select>
        </div>

        <div>
          <label>月份：</label>
          <Select value={month} onChange={handleMonthChange}>
            <option value="">全部</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month.toString().padStart(2, "0")}>
                {month}月
              </option>
            ))}
          </Select>
        </div>
      </FilterSection>
      <TabContainer>
        <TabButton
          active={activeTab === "table"}
          onClick={() => setActiveTab("table")}
        >
          表格视图
        </TabButton>
        <TabButton
          active={activeTab === "other"}
          onClick={() => setActiveTab("other")}
        >
          可视化
        </TabButton>
      </TabContainer>

      {activeTab === "table" ? (
        rows.length ? (
          <Table>
            <thead>
              <tr>
                <th>序号</th>
                <th>标题</th>
                <SortableHeader
                  sortable
                  onClick={() => handleSort("votes")}
                  data-sort-direction={
                    sort.field === "votes" ? sort.direction : undefined
                  }
                >
                  投票数
                </SortableHeader>
                <SortableHeader
                  sortable
                  onClick={() => handleSort("average_score")}
                  data-sort-direction={
                    sort.field === "average_score" ? sort.direction : undefined
                  }
                >
                  平均得分
                </SortableHeader>
                <SortableHeader
                  sortable
                  onClick={() => handleSort("bayesian_average_score")}
                  data-sort-direction={
                    sort.field === "bayesian_average_score"
                      ? sort.direction
                      : undefined
                  }
                >
                  贝叶斯平均得分
                </SortableHeader>
                <th>标准差</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((post, index) => (
                <TableRowWithAnimation key={post.id} index={index}>
                  <td>{index + 1}</td>
                  <td>
                    <MovieLink
                      href={generateThreadUrl(post.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.subject}
                    </MovieLink>
                  </td>
                  <td>{post.votes}</td>
                  <td>{post.average_score.toFixed(2)}</td>
                  <td>{post.bayesian_average_score.toFixed(2)}</td>
                  <td>{post.standard_deviation.toFixed(2)}</td>
                </TableRowWithAnimation>
              ))}
            </tbody>
          </Table>
        ) : (
          <ErrorMessage>
            No data available for the selected filters
          </ErrorMessage>
        )
      ) : rows?.length ? (
        <VisualizationView posts={filterPosts(posts) || []} />
      ) : (
        <ErrorMessage>No data available for the selected filters</ErrorMessage>
      )}
      <ScrollToTopButton
        visible={showScrollTop}
        onClick={scrollToTop}
        aria-label="返回顶部"
      >
        ↑
      </ScrollToTopButton>
    </Container>
  );
}

export default App;
