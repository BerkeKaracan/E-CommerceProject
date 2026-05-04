import { render, screen } from '@testing-library/react';
import ProductClient from '@/app/product/[id]/ProductClient';

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useParams() {
    return {
      id: '1',
    };
  },
}));

const mockProduct = {
  id: 1,
  name: "Premium AI Watch",
  category: "Electronics",
  price: 299.99,
  image: "/watch.jpg",
  description: "A high-end smartwatch for tech lovers."
};

describe('ProductClient Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(<ProductClient initialProduct={mockProduct} />);

    const productName = screen.getByText(/Premium AI Watch/i);
    expect(productName).toBeInTheDocument();

    const productPrice = screen.getByText(/\$299.99/i);
    expect(productPrice).toBeInTheDocument();
  });
});