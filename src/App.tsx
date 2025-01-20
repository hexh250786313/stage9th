import React, { useEffect, useRef, useState } from 'react';
import useSWRImmutable from 'swr/immutable';
import { Container } from './styles/components/Container';
import { ErrorMessageContainer } from './styles/components/ErrorMessageContainer';
import { FilterContainer } from './styles/components/FilterContainer';
import { FilterItem } from './styles/components/FilterItem';
import { FilterSection } from './styles/components/FilterSection';
import { InfoLink } from './styles/components/InfoLink';
import { InfoSection } from './styles/components/InfoSection';
import { LoadingMessage } from './styles/components/LoadingMessage';
import { MovieLink } from './styles/components/MovieLink';
import { MovieTitle } from './styles/components/MovieTitle';
import { ScrollToTopButton } from './styles/components/ScrollToTopButton';
import { SearchInput } from './styles/components/SearchInput';
import { Select } from './styles/components/Select';
import { SortableHeader } from './styles/components/SortableHeader';
import { TabButton } from './styles/components/TabButton';
import { TabContainer } from './styles/components/TabContainer';
import { Table } from './styles/components/Table';
import { TableRow } from './styles/components/TableRow';
import { VisualizationContainer } from './styles/components/VisualizationContainer';

// 类型定义
interface PaginationState {
    page: number;
    pageSize: number;
    hasMore: boolean;
}

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

type SortField = 'votes' | 'average_score' | 'bayesian_average_score';
type SortDirection = 'asc' | 'desc';

interface SortState {
    field: SortField;
    direction: SortDirection;
}

const generateThreadUrl = (id: number) => `https://bbs.saraba1st.com/2b/thread-${id}-1-1.html`;

const TableRowWithAnimation = ({ children }: { children: React.ReactNode; index: number }) => {
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

// fetcher 函数
const fetcher = (url: string) =>
    fetch(url)
        .then((res) => res.json())
        .then((res) => {
            return {
                posts: res.poll,
                lastUpdated: res.last_updated,
            };
        });

// 延迟出现警告字样
const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsVisible(true);
        }, 500);

        return () => clearTimeout(timeout);
    }, []);

    return <ErrorMessageContainer style={{ opacity: isVisible ? 1 : 0 }}>{children}</ErrorMessageContainer>;
};

const VisualizationView = ({ posts }: { posts: Post[] }) => {
    // 先按投票人数排序
    const sortedPosts = [...posts].sort((a, b) => b.votes - a.votes).slice(0, 75); // 只取前30个

    // 计算字体大小范围
    const isMobile = window.innerWidth <= 768;
    const firstPlaceFontSize = isMobile ? 48 : 64;
    const maxFontSize = isMobile ? 32 : 48;
    const minFontSize = isMobile ? 10 : 12;

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
        // 找到第二个 ] 的位置，移除之前的所有内容
        const titleOnly = subject.replace(/^.*?\].*?\]/, '').trim();

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
            key={sortedPosts.map((p) => p.id).join(',')} // 添加key强制重新渲染
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
        data: { posts, lastUpdated = 0 } = {},
        error,
        isLoading,
    } = useSWRImmutable<{ posts: Post[]; lastUpdated: number }>(
        'https://s1-vote-3rd.pages.dev/poll_results.json',
        fetcher,
    );
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        pageSize: 100,
        hasMore: true,
    });
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        if (isLoading) {
            // 在浏览器空闲时才加载字体
            const loadFont = () => {
                // 检查是否已经加载过这个 CSS
                const existingLink = document.querySelector(
                    'link[href="https://s1.hdslb.com/bfs/static/jinkela/long/font/regular.css"]',
                );

                if (!existingLink) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://s1.hdslb.com/bfs/static/jinkela/long/font/regular.css';
                    document.head.appendChild(link);
                }
            };

            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(loadFont);
            } else {
                // 降级方案
                setTimeout(loadFont, 1000);
            }
        }
    }, [isLoading]);

    const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);

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

    const [year, setYear] = useState<string>('');
    const [quarter, setQuarter] = useState<string>('');
    const [month, setMonth] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'table' | 'other'>('table');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [sort, setSort] = useState<SortState>({
        field: 'bayesian_average_score',
        direction: 'desc',
    });

    const handleSort = (field: SortField) => {
        setSort((prevSort) => ({
            field,
            direction: prevSort.field === field && prevSort.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const getSortedPosts = (posts: Post[], shouldPaginate: boolean = true) => {
        const filteredPosts = filterPosts(posts);
        const sortedPosts = [...filteredPosts].sort((a, b) => {
            const multiplier = sort.direction === 'desc' ? -1 : 1;
            return (a[sort.field] - b[sort.field]) * multiplier;
        });

        if (!shouldPaginate) return sortedPosts;

        const start = 0;
        const end = pagination.page * pagination.pageSize;
        return sortedPosts.slice(start, end);
    };

    // 添加滚动监听和加载更多功能;
    useEffect(() => {
        const handleScroll = () => {
            if (!pagination.hasMore) return;

            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollHeight - scrollTop - clientHeight < 100) {
                setPagination((prev) => {
                    const nextPage = prev.page + 1;
                    const totalPosts = posts ? filterPosts(posts).length : 0;
                    const hasMore = nextPage * prev.pageSize < totalPosts;

                    return {
                        ...prev,
                        page: nextPage,
                        hasMore,
                    };
                });
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pagination.hasMore, posts]);

    useEffect(() => {
        if (posts) {
            const sortedPosts = getSortedPosts(posts);
            setDisplayedPosts(sortedPosts);
            setPagination((prev) => ({
                ...prev,
                hasMore: sortedPosts.length < filterPosts(posts).length,
            }));
        }
    }, [posts, sort, year, quarter, month, pagination.page, activeTab, searchTerm]);

    // 监听滚动事件
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300); // 滚动超过300px显示按钮
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const years = getAvailableYears(posts);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setYear(e.target.value);
        setSearchTerm(''); // 清空搜索
        setPagination({ page: 1, pageSize: 100, hasMore: true });
    };

    const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQuarter(e.target.value);
        setMonth(''); // 清空月份
        setSearchTerm(''); // 清空搜索
        setPagination({ page: 1, pageSize: 100, hasMore: true });
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMonth(e.target.value);
        setQuarter(''); // 清空季度
        setSearchTerm(''); // 清空搜索
        setPagination({ page: 1, pageSize: 100, hasMore: true });
    };

    const filterPosts = (posts: Post[] | undefined) => {
        if (!posts) return [];

        // 如果有搜索词，只按搜索词过滤
        if (searchTerm.trim()) {
            return posts.filter((post) => post.subject.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return posts.filter((post) => {
            const match = post.subject.match(/\[(\d{4})[./](\d{1,2})\]/);
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
                if (!quarterMap[quarter as keyof typeof quarterMap].includes(postMonth)) return false;
            }

            if (month && postMonth !== parseInt(month)) return false;

            return true;
        });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim()) {
            // 清空其他筛选条件
            setYear('');
            setQuarter('');
            setMonth('');
        }
        // 重置分页
        setPagination({
            page: 1,
            pageSize: 100,
            hasMore: true,
        });
        // 清空已显示的帖子，强制重新计算
        // setDisplayedPosts([]);
    };

    if (error) return <ErrorMessage>Failed to load data</ErrorMessage>;
    if (isLoading) return <LoadingMessage>Loading...</LoadingMessage>;
    const rows = getSortedPosts(posts || []);

    return (
        <>
            <Container>
                <FilterContainer>
                    <FilterSection>
                        <FilterItem>
                            <label>年份：</label>
                            <Select value={year} onChange={handleYearChange}>
                                <option value="">全部</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}年
                                    </option>
                                ))}
                            </Select>
                        </FilterItem>

                        <FilterItem>
                            <label>季度：</label>
                            <Select value={quarter} onChange={handleQuarterChange}>
                                <option value="">全部</option>
                                <option value="Q1">一季度 (1-3月)</option>
                                <option value="Q2">二季度 (4-6月)</option>
                                <option value="Q3">三季度 (7-9月)</option>
                                <option value="Q4">四季度 (10-12月)</option>
                            </Select>
                        </FilterItem>

                        <FilterItem>
                            <label>月份：</label>
                            <Select value={month} onChange={handleMonthChange}>
                                <option value="">全部</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <option key={month} value={month.toString().padStart(2, '0')}>
                                        {month}月
                                    </option>
                                ))}
                            </Select>
                        </FilterItem>

                        <FilterItem>
                            <label>搜索标题：</label>
                            <SearchInput
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="输入标题关键词..."
                            />
                        </FilterItem>
                    </FilterSection>
                    <InfoSection>
                        <div>数据更新时间：{new Date(lastUpdated * 1000).toLocaleString()}</div>
                        <div>
                            数据来源：
                            <InfoLink
                                href="https://s1-vote-3rd.pages.dev/poll_results.json"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                查看原始数据
                            </InfoLink>
                        </div>
                        <div>
                            本站数据基于&nbsp;
                            <InfoLink
                                href="https://bbs.saraba1st.com/2b/space-uid-465414.html"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Junakr
                            </InfoLink>
                            &nbsp;开发的&nbsp;
                            <InfoLink href="https://s1-vote-3rd.pages.dev" target="_blank" rel="noopener noreferrer">
                                https://s1-vote-3rd.pages.dev
                            </InfoLink>
                        </div>
                    </InfoSection>
                </FilterContainer>
                <TabContainer>
                    <TabButton
                        active={activeTab === 'table'}
                        onClick={() => {
                            setActiveTab('table');
                            // 先重置分页状态
                            setPagination({
                                page: 1,
                                pageSize: 100,
                                hasMore: true,
                            });
                        }}
                    >
                        表格视图
                    </TabButton>
                    <TabButton active={activeTab === 'other'} onClick={() => setActiveTab('other')}>
                        可视化
                    </TabButton>
                </TabContainer>

                {activeTab === 'table' ? (
                    displayedPosts.length ? (
                        <>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>标题</th>
                                        <SortableHeader
                                            sortable
                                            onClick={() => handleSort('bayesian_average_score')}
                                            data-sort-direction={
                                                sort.field === 'bayesian_average_score' ? sort.direction : undefined
                                            }
                                        >
                                            贝叶斯平均得分
                                        </SortableHeader>
                                        <SortableHeader
                                            sortable
                                            onClick={() => handleSort('votes')}
                                            data-sort-direction={sort.field === 'votes' ? sort.direction : undefined}
                                        >
                                            投票数
                                        </SortableHeader>
                                        <SortableHeader
                                            sortable
                                            onClick={() => handleSort('average_score')}
                                            data-sort-direction={
                                                sort.field === 'average_score' ? sort.direction : undefined
                                            }
                                        >
                                            平均得分
                                        </SortableHeader>
                                        <th>标准差</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedPosts.map((post, index) => (
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
                                            <td>{post.bayesian_average_score.toFixed(2)}</td>
                                            <td>{post.votes}</td>
                                            <td>{post.average_score.toFixed(2)}</td>
                                            <td>{post.standard_deviation.toFixed(2)}</td>
                                        </TableRowWithAnimation>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    ) : (
                        <ErrorMessage>No data available for the selected filters</ErrorMessage>
                    )
                ) : rows?.length ? (
                    <VisualizationView posts={filterPosts(posts) || []} />
                ) : (
                    <ErrorMessage>No data available for the selected filters</ErrorMessage>
                )}
                <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} aria-label="返回顶部">
                    ↑
                </ScrollToTopButton>
            </Container>
        </>
    );
}

export default App;
