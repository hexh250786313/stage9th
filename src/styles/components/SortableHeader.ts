import { styled } from '../helpers/styled';

export const SortableHeader = styled.th<{ sortable?: boolean }>`
    cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
    position: relative;
    padding-right: ${(props) => (props.sortable ? '24px' : '8px')} !important;

    &:hover {
        background-color: ${(props) => (props.sortable ? '#e6e6e6' : '#f4f4f4')};
    }

    &::after {
        content: ${(props) => (props.sortable ? "'↕'" : 'none')};
        position: absolute;
        right: 8px;
        opacity: 0.5;
    }

    &[data-sort-direction='asc']::after {
        content: '↑';
        opacity: 1;
    }

    &[data-sort-direction='desc']::after {
        content: '↓';
        opacity: 1;
    }
`;
