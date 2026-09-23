import "@testing-library/dom";
import { vi } from "vitest";

vi.mock("react-leaflet", async () => import("./test/reactLeafletMock"));
