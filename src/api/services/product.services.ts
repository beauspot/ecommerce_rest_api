import { productModel } from "../models/productsModels";
import { authModel } from "../models/userModels";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../helpers/custom-errors";
import { Model } from "mongoose"; // Import necessary types from Mongoose
import {
  ProductDataInterface,
  GetAllProductsOptions,
} from "../interfaces/product_Interface"; // Import ProductDataInterface

//Create a Product Service
export const createProductService = async (product: ProductDataInterface) => {
  const newProduct = await productModel.create({ ...product });
  if (!newProduct) {
    throw new CustomAPIError(
      "Product creation failed",
      StatusCodes.BAD_REQUEST
    );
  }
  return newProduct;
};

// Fetch All Products Services
export const getAllProductsService = async (
  productModel: Model<ProductDataInterface>,
  options: GetAllProductsOptions
): Promise<ProductDataInterface[]> => {
  // Sorting, limiting and pagination of the Products
  const { sortBy, sortOrder, limit, page, category, brand } = options;
  const skip = (page - 1) * limit;

  const sortCriteria: any = {};
  sortCriteria[sortBy] = sortOrder === "asc" ? 1 : -1;

  const query: any = {};

  if (category) {
    query.category = category;
  }

  if (brand) {
    query.brand = brand;
  }

  const allProducts = await productModel
    .find()
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .exec();
  if (allProducts.length <= 0) {
    throw new CustomAPIError("No products found", StatusCodes.NO_CONTENT);
  }
  return allProducts;
};
// Get a single product by its ID Service
export const getSingleProductService = async (productID: string) => {
  const productExists = await productModel.findById({ _id: productID });
  // console.log(productExists);
  if (!productExists) {
    throw new CustomAPIError(
      `the product with the id ${productID} does not exist`,
      StatusCodes.NOT_FOUND
    );
  }
  return productExists;
};

// updating a product Service
export const updateProductService = async (
  prodId: string,
  updateData: Partial<ProductDataInterface>
) => {
  // const { _id } = prodId;
  const updateProduct = await productModel.findByIdAndUpdate(
    { _id: prodId },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
  // console.log(prodId);
  if (!updateProduct)
    throw new CustomAPIError(
      `The Product with the id: ${prodId} was not found to be updated.`,
      StatusCodes.NOT_FOUND
    );
  return updateProduct;
};

// Deleting a product Service
export const deleteProductService = async (prodID: string) => {
  const product = await productModel.findOneAndDelete({ _id: prodID });
  // console.log(product);
  if (!product)
    throw new CustomAPIError(
      `The Product with the id: ${prodID} was not found to be deleted`,
      StatusCodes.BAD_REQUEST
    );
  return product;
};

// add to wishlist functionality
export const addToWishListService = async (userID: string, prodID: string) => {
  try {
    const user = await authModel.findById(userID);
    // console.log(user);
    if (!user) {
      // Handle the case where user is not found
      throw new CustomAPIError("User not found", StatusCodes.NOT_FOUND);
    }
    const alreadyAdded = user.wishlists.find((id) => id.toString() === prodID);

    if (alreadyAdded) {
      return await authModel.findByIdAndUpdate(
        userID,
        {
          $pull: { wishlists: prodID },
        },
        {
          new: true,
        }
      );
    } else {
      return await authModel.findByIdAndUpdate(
        userID,
        {
          $push: { wishlists: prodID },
        },
        {
          new: true,
        }
      );
    }
  } catch (err) {
    throw new CustomAPIError(
      "Could not add product to wishlists",
      StatusCodes.BAD_REQUEST
    );
  }
};

export const rateProductService = async (
  userID: string,
  prodID: string,
  star: number,
  comment: string
) => {
  try {
    const product = await productModel.findById(prodID);
    if (!product) {
      throw new CustomAPIError(`Product not found`, StatusCodes.NOT_FOUND);
    }
    let alreadyRated = product.ratings.find(
      (rating) => rating.postedBy.toString() === userID
    );
    if (alreadyRated) {
      await productModel.updateOne(
        {
          "ratings.postedBy": userID,
        },
        {
          $set: { "ratings.$.star": star, "ratings.$.comment": comment },
        }
      );
    } else {
      await productModel.findByIdAndUpdate(prodID, {
        $push: {
          ratings: {
            star: star,
            comment: comment,
            postedBy: userID,
          },
        },
      });
    }
    const getAllRatings = await productModel.findById(prodID);
    if (!getAllRatings) {
      throw new CustomAPIError(`Ratings not found`, StatusCodes.NOT_FOUND);
    }
    let totalRating = getAllRatings.ratings.length;
    let ratingsum =
      totalRating === 0
        ? 0
        : getAllRatings.ratings
            .map((item) => item.star)
            .reduce((prev, curr) => prev + curr, 0);
    let actualRating =
      totalRating === 0 ? 0 : Math.round(ratingsum / totalRating);

    const finalproduct = await productModel.findByIdAndUpdate(
      prodID,
      {
        totalrating: actualRating,
      },
      { new: true }
    );
    return finalproduct;
  } catch (err: any) {
    throw new Error(err.message);
  }
};
