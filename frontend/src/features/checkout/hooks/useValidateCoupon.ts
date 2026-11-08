import { useMutation } from "@tanstack/react-query";
import { validateCoupon } from "../api/checkoutApi";

export function useValidateCoupon() {
  return useMutation({ mutationFn: validateCoupon });
}
