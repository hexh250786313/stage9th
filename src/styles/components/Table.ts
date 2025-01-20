import { styled } from '../helpers/styled';

export const Table = styled.table`
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
        color: white;
    }

    @media (max-width: 768px) {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;

        th,
        td {
            padding: 6px;
            font-size: 14px;
        }
    }
`;
