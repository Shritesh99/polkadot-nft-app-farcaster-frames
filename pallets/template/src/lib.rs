#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;
pub mod weights;
pub use weights::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;
    use sp_std::vec::Vec;

    #[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default, TypeInfo, MaxEncodedLen)]
    pub struct NFT<AccountId> {
        pub owner: AccountId,
        pub metadata: BoundedVec<u8, ConstU32<256>>,
    }

    pub type CollectionId = u32;
    pub type ItemId = u32;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type WeightInfo: WeightInfo;
    }

    #[pallet::storage]
    #[pallet::getter(fn nfts)]
    pub type Nfts<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        CollectionId,
        Blake2_128Concat,
        ItemId,
        NFT<T::AccountId>,
        OptionQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn next_item_id)]
    pub type NextItemId<T: Config> =
        StorageMap<_, Blake2_128Concat, CollectionId, ItemId, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn next_collection_id)]
    pub type NextCollectionId<T: Config> = StorageValue<_, CollectionId, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        NFTMinted(CollectionId, ItemId, T::AccountId),
        NFTTransferred(CollectionId, ItemId, T::AccountId, T::AccountId),
    }

    #[pallet::error]
    pub enum Error<T> {
        NFTNotFound,
        NotNFTOwner,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Mint an NFT under a given collection with provided metadata.
        #[pallet::call_index(0)]
        #[pallet::weight(10_000)]
        pub fn mint_nft(
            origin: OriginFor<T>,
            collection_id: CollectionId,
            metadata: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            // Convert the metadata Vec into a BoundedVec.
            let bounded_metadata: BoundedVec<u8, ConstU32<256>> =
                metadata.try_into().map_err(|_| Error::<T>::NFTNotFound)?; // You may want a specific error here

            // Get the next item ID for the given collection.
            let item_id = NextItemId::<T>::get(collection_id);
            // Create the NFT.
            let nft = NFT {
                owner: sender.clone(),
                metadata: bounded_metadata,
            };

            // Insert the NFT into storage.
            Nfts::<T>::insert(collection_id, item_id, nft);
            // Update the next item ID for this collection.
            NextItemId::<T>::insert(collection_id, item_id.saturating_add(1));

            Self::deposit_event(Event::NFTMinted(collection_id, item_id, sender));
            Ok(())
        }

        /// Transfer an NFT from the caller to another account.
        #[pallet::call_index(1)]
        #[pallet::weight(10_000)]
        pub fn transfer_nft(
            origin: OriginFor<T>,
            collection_id: CollectionId,
            item_id: ItemId,
            to: T::AccountId,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            // Ensure the NFT exists and mutate it.
            Nfts::<T>::try_mutate(collection_id, item_id, |nft_option| -> DispatchResult {
                let nft = nft_option.as_mut().ok_or(Error::<T>::NFTNotFound)?;
                // Ensure the sender is the owner.
                ensure!(nft.owner == sender, Error::<T>::NotNFTOwner);
                // Transfer ownership.
                nft.owner = to.clone();
                Ok(())
            })?;

            Self::deposit_event(Event::NFTTransferred(collection_id, item_id, sender, to));
            Ok(())
        }
    }
}
