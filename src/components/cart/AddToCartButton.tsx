"use client"

import { useAuth } from "@/lib/providers/AuthProvider"
import { useMutation, useQuery } from "@urql/next"
import { Icons } from "../icons"

import { Button, ButtonProps } from "../ui/button"

import { User } from "@supabase/auth-helpers-nextjs"
import { Suspense } from "react"
import { useToast } from "../ui/use-toast"
import { FetchCartQuery } from "./UserCartSection"
import { createCartMutation, updateCartsMutation } from "./query"
import useCartStore from "./useCartStore"

interface AddToCartButtonProps extends ButtonProps {
  productId: string
  quantity?: number
  cartId?: string
}

function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const addProductToCart = useCartStore((s) => s.addProductToCart)
  const guestAddProduct = () => {
    addProductToCart(productId, 1)
    toast({ title: "Sucess, Added a Product to the Cart." })
  }
  if (!user) {
    return (
      <Button className="rounded-full p-0 h-8 w-8" onClick={guestAddProduct}>
        <Icons.basket className="h-5 w-5 md:h-4 md:w-4" />
      </Button>
    )
  } else {
    return (
      <Suspense>
        <UserCartButton user={user} productId={productId} />
      </Suspense>
    )
  }
}

export default AddToCartButton

const UserCartButton = ({
  user,
  productId,
}: {
  user: User
  productId: string
}) => {
  const { toast } = useToast()

  const [res, addToCart] = useMutation(createCartMutation)
  const [, updateCart] = useMutation(updateCartsMutation)

  const [{ data, fetching, error }, refetch] = useQuery({
    query: FetchCartQuery,
    variables: {
      userId: user.id,
    },
  })

  const onClickHandler = async () => {
    const existedProduct = data.cartsCollection.edges.find(
      ({ node }) => node.product_id === productId
    )
    try {
      if (!existedProduct) {
        const res = await addToCart({
          productId: productId,
          userId: user.id,
          quantity: 1,
        })
        refetch({ requestPolicy: "network-only" })

        console.log("resss!!!!", res)

        if (res) toast({ title: "Sucess, Added a Product to the Cart." })
      } else {
        const res = await updateCart({
          productId: productId,
          userId: user.id,
          newQuantity: existedProduct.node.quantity + 1,
        })
        if (res) toast({ title: "Sucess, Added a Product to the Cart." })
      }
    } catch (err) {
      toast({ title: "Error, Unexpected Error occurred." })
    }
  }

  return (
    <Button
      className="rounded-full p-0 h-8 w-8"
      // disabled={fetching || error ? true : false}
      onClick={onClickHandler}
    >
      <Icons.basket className="h-5 w-5 md:h-4 md:w-4" />
    </Button>
  )
}
