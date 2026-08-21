import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import ProductClient from "@/app/product/[id]/ProductClient";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";

function renderProduct(ui: ReactElement) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <AuthProvider>{ui}</AuthProvider>
    </ThemeProvider>,
  );
}

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return "/product/1";
  },
  useParams() {
    return {
      id: "1",
    };
  },
}));

const mockProduct = {
  id: 1,
  name: "Premium AI Watch",
  category: "Electronics",
  price: 299.99,
  image: "/watch.jpg",
  description: "A high-end smartwatch for tech lovers.",
  stock: 50,
};

describe("ProductClient Component", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders product information correctly", () => {
    renderProduct(<ProductClient initialProduct={mockProduct} />);

    const productName = screen.getByText(/Premium AI Watch/i);
    expect(productName).toBeInTheDocument();

    const productPrice = screen.getByText(/\$299.99/i);
    expect(productPrice).toBeInTheDocument();
  });

  it("updates the quantity when increment and decrement buttons are clicked", async () => {
    const user = userEvent.setup();
    renderProduct(<ProductClient initialProduct={mockProduct} />);

    const quantityDisplay = screen.getByText("1");
    expect(quantityDisplay).toBeInTheDocument();

    const incrementButton = screen.getByText("+");
    const decrementButton = screen.getByText("-");

    await user.click(incrementButton);
    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(decrementButton);
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
