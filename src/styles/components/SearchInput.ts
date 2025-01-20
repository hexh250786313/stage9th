import { styled } from '../helpers/styled';

export const SearchInput = styled.input`
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    width: 200px;

    @media (max-width: 768px) {
        width: 100%;
    }
`;
