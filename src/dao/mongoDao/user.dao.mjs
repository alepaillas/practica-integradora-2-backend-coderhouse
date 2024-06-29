import { userModel } from "../models/user.model.mjs";

const getAll = async (query, options) => {
  const users = await userModel.paginate(query, options);
  return users;
};

const getById = async (id) => {
  const user = await userModel.findById(id);
  return user;
};

const getByEmail = async (email) => {
  const user = await userModel.findOne({ email });
  return user;
};

const create = async (data) => {
  const user = await userModel.create(data);
  return user;
};

const update = async (id, data) => {
  await userModel.findByIdAndUpdate(id, data);
  const user = await userModel.findById(id);
  return user;
};

const deleteOne = async (id) => {
  const user = await userModel.deleteOne({ _id: id });
  if (user.deletedCount === 0) return false;
  return true;
};

export default {
  getAll,
  getById,
  getByEmail,
  create,
  update,
  deleteOne,
};
